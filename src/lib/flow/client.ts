import crypto from 'crypto'
import type { FlowCreateResponse, FlowStatusResponse } from './types'

/* ============================================================================
   SCRONTER — CLIENTE DE FLOW (SOLO SERVIDOR)
   ============================================================================

   ⚠️  ESTE ARCHIVO NUNCA DEBE IMPORTARSE DESDE UN COMPONENTE DE CLIENTE.
   Lee `FLOW_SECRET_KEY`, que jamás puede llegar al navegador. Vive únicamente
   detrás de las rutas de /src/app/api/flow/*.

   Las variables NO llevan el prefijo NEXT_PUBLIC_ justamente para que Next se
   niegue a incluirlas en el bundle del cliente. Si alguna vez ves un error de
   "FLOW_SECRET_KEY is not defined" en el browser, significa que este módulo se
   coló en un componente cliente — es un bug de seguridad, no de configuración.

   Documentación de referencia: https://developers.flow.cl/en/api
   ============================================================================ */

/** Base de la API según el ambiente. Sandbox y producción tienen credenciales
 *  COMPLETAMENTE distintas: usar la key de uno contra el otro devuelve
 *  "apiKey not found" (401). */
function baseUrl(): string {
  const env = process.env.FLOW_ENV ?? 'sandbox'
  return env === 'production' ? 'https://www.flow.cl/api' : 'https://sandbox.flow.cl/api'
}

/** Lee una variable de entorno obligatoria y falla fuerte y claro si falta.
 *  Preferible a un `!` de TypeScript, que dejaría pasar `undefined` hasta que
 *  Flow devuelva un 401 confuso. */
function requireEnv(nombre: 'FLOW_API_KEY' | 'FLOW_SECRET_KEY'): string {
  const valor = process.env[nombre]
  if (!valor) {
    throw new Error(
      `Falta la variable de entorno ${nombre}. ` +
        `Copiá .env.local.example a .env.local y pegá tus credenciales de Flow. ` +
        `Se obtienen en sandbox.flow.cl → "Mis datos" → pestaña "Integraciones".`,
    )
  }
  return valor
}

/**
 * Firma HMAC-SHA256 de Flow. Es la parte que más se rompe en las
 * integraciones, así que vale entender exactamente qué hace:
 *
 *   1. Ordena las claves ALFABÉTICAMENTE (por clave, no por valor).
 *   2. Concatena `clave1valor1clave2valor2...` — SIN ningún separador.
 *      No hay "&" ni "=" entre pares. Agregarlos rompe la firma.
 *   3. HMAC-SHA256 usando el SECRET KEY como llave (no el API key).
 *   4. Hex. Ese string es el parámetro `s`.
 *
 * Se firman los valores CRUDOS, sin URL-encodear. El encoding se aplica
 * después, al armar el body o el query string.
 *
 * El parámetro `s` nunca se incluye en el string a firmar.
 */
export function sign(params: Record<string, string>, secretKey: string): string {
  const aFirmar = Object.keys(params)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join('')

  return crypto.createHmac('sha256', secretKey).update(aFirmar, 'utf8').digest('hex')
}

/**
 * Agrega el apiKey, firma todo y devuelve los parámetros listos para enviar.
 * El apiKey tiene que estar DENTRO de lo que se firma — olvidarlo es la
 * segunda causa más común de "Invalid signature".
 */
export function buildSignedParams(params: Record<string, string>): URLSearchParams {
  const conApiKey = { ...params, apiKey: requireEnv('FLOW_API_KEY') }
  const s = sign(conApiKey, requireEnv('FLOW_SECRET_KEY'))
  return new URLSearchParams({ ...conApiKey, s })
}

/* --------------------------------------------------------------------------
   ENDPOINTS
   -------------------------------------------------------------------------- */

export interface CreatePaymentInput {
  /** Nuestro ID de orden. Máx 40 caracteres, único por intento. */
  commerceOrder: string
  /** Descripción que ve el comprador en el checkout de Flow. Máx 255. */
  subject: string
  /** Entero CLP. Mínimo 350. */
  amount: number
  email: string
  /** URL pública donde Flow hace POST al confirmar. NO sirve localhost. */
  urlConfirmation: string
  /** A dónde se redirige al comprador al terminar. */
  urlReturn: string
  /** Metadata extra, se serializa a JSON. Máx 255 caracteres ya serializado. */
  optional?: Record<string, string>
}

/**
 * Crea el pago en Flow y devuelve la URL a la que hay que redirigir.
 *
 * Content-Type obligatorio: application/x-www-form-urlencoded.
 * Mandar JSON acá devuelve un 400 poco descriptivo.
 */
export async function createPayment(input: CreatePaymentInput): Promise<{
  redirectUrl: string
  token: string
  flowOrder: number
}> {
  if (!Number.isInteger(input.amount)) {
    throw new Error(`El monto debe ser un entero. Recibido: ${input.amount}`)
  }
  if (input.amount < 350) {
    throw new Error(`Flow exige un mínimo de 350 CLP. Recibido: ${input.amount}`)
  }
  if (input.commerceOrder.length > 40) {
    throw new Error(`commerceOrder supera los 40 caracteres: ${input.commerceOrder}`)
  }

  const params: Record<string, string> = {
    commerceOrder: input.commerceOrder,
    subject: input.subject.slice(0, 255),
    amount: String(input.amount),
    email: input.email,
    urlConfirmation: input.urlConfirmation,
    urlReturn: input.urlReturn,
    currency: 'CLP',
    // 9 = todos los medios de pago habilitados en la cuenta (WebPay, Mach,
    // Khipu, efectivo…). Cambiá a 1 si querés forzar solo WebPay.
    paymentMethod: '9',
  }

  if (input.optional) {
    params.optional = JSON.stringify(input.optional).slice(0, 255)
  }

  const body = buildSignedParams(params)

  const res = await fetch(`${baseUrl()}/payment/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    cache: 'no-store',
  })

  const texto = await res.text()

  if (!res.ok) {
    // El cuerpo del error de Flow es la información más útil para depurar,
    // así que se propaga en vez de tragárselo.
    throw new Error(`Flow /payment/create respondió ${res.status}: ${texto}`)
  }

  const data = JSON.parse(texto) as FlowCreateResponse

  if (!data.url || !data.token) {
    throw new Error(`Respuesta inesperada de Flow: ${texto}`)
  }

  return {
    // Así se arma el redirect según la documentación: url + "?token=" + token
    redirectUrl: `${data.url}?token=${data.token}`,
    token: data.token,
    flowOrder: data.flowOrder,
  }
}

/**
 * Consulta el estado real de un pago.
 *
 * Se llama SIEMPRE desde el webhook antes de despachar: el webhook solo
 * entrega un token, no una prueba de pago. Confiar en el webhook sin verificar
 * es lo que permite que alguien te dispare un POST falso y active una orden.
 */
export async function getPaymentStatus(token: string): Promise<FlowStatusResponse> {
  const params = buildSignedParams({ token })

  const res = await fetch(`${baseUrl()}/payment/getStatus?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  })

  const texto = await res.text()

  if (!res.ok) {
    throw new Error(`Flow /payment/getStatus respondió ${res.status}: ${texto}`)
  }

  return JSON.parse(texto) as FlowStatusResponse
}

/**
 * Busca un pago por NUESTRO id de orden en vez del token de Flow.
 *
 * Sirve para recuperación manual: si el webhook se cayó, Flow no lo reintenta
 * indefinidamente, pero el pago sigue siendo válido. Con esto podés reconciliar
 * una orden que quedó "pendiente" pero en realidad se pagó.
 */
export async function getStatusByCommerceOrder(
  commerceOrder: string,
): Promise<FlowStatusResponse> {
  const params = buildSignedParams({ commerceId: commerceOrder })

  const res = await fetch(
    `${baseUrl()}/payment/getStatusByCommerceId?${params.toString()}`,
    { method: 'GET', cache: 'no-store' },
  )

  const texto = await res.text()

  if (!res.ok) {
    throw new Error(`Flow /payment/getStatusByCommerceId respondió ${res.status}: ${texto}`)
  }

  return JSON.parse(texto) as FlowStatusResponse
}
