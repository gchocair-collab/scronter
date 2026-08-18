import { NextRequest, NextResponse } from 'next/server'
import type { Buyer, CartLine } from '@/types'
import { createPayment } from '@/lib/flow/client'
import { esLocal, getSiteUrl } from '@/lib/site-url'
import {
  attachFlowToken,
  calcularTotal,
  createOrder,
  generateCommerceOrder,
} from '@/lib/orders/store'

/* ============================================================================
   POST /api/flow/create-payment
   ============================================================================

   Inicia el pago. Es el único punto donde nace una orden.

   Regla que gobierna todo este archivo: NADA de lo que manda el navegador se
   toma como verdad, salvo los IDs y las cantidades. Precios, subtotales y total
   se calculan acá adentro. El cliente no manda plata, manda intenciones.
   ============================================================================ */

// Lee y escribe estado mutable (crea órdenes) y habla con Flow: nunca se cachea.
export const dynamic = 'force-dynamic'

/**
 * Validación de email deliberadamente simple: algo@algo.algo sin espacios.
 * No intentamos una RFC 5322 completa — las regex "perfectas" rechazan mails
 * válidos y siguen aceptando basura. La verificación real es que el comprador
 * reciba el correo de Flow.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Los 6 campos del checkout, con su etiqueta para el mensaje de error. */
const CAMPOS_BUYER: Array<{ key: keyof Buyer; label: string }> = [
  { key: 'nombre', label: 'nombre' },
  { key: 'email', label: 'email' },
  { key: 'telefono', label: 'teléfono' },
  { key: 'direccion', label: 'dirección' },
  { key: 'comuna', label: 'comuna' },
  { key: 'ciudad', label: 'ciudad' },
]

/** 400 con un mensaje que el formulario puede mostrar tal cual al usuario. */
function malaSolicitud(error: string): NextResponse {
  return NextResponse.json({ error }, { status: 400 })
}

export async function POST(req: NextRequest) {
  try {
    /* ---------------------------------------------------------------------
       1. Parseo del body.
       Un JSON roto entra por acá y no por el catch general, para poder
       responder 400 (culpa del cliente) en vez de 500 (culpa nuestra).
       --------------------------------------------------------------------- */
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return malaSolicitud('No pudimos leer los datos del formulario.')
    }

    if (typeof body !== 'object' || body === null) {
      return malaSolicitud('No pudimos leer los datos del formulario.')
    }

    const { lines: linesRaw, buyer: buyerRaw } = body as {
      lines?: unknown
      buyer?: unknown
    }

    /* ---------------------------------------------------------------------
       2. Validación de las líneas del carrito.
       Solo chequeamos la FORMA acá. Que el producto exista y tenga stock lo
       resuelve calcularTotal(), que además es la única fuente del monto.
       --------------------------------------------------------------------- */
    if (!Array.isArray(linesRaw) || linesRaw.length === 0) {
      return malaSolicitud('Tu carrito está vacío.')
    }

    const lines: CartLine[] = []

    for (const item of linesRaw) {
      if (typeof item !== 'object' || item === null) {
        return malaSolicitud('Hay un producto inválido en el carrito. Vacialo y agregalo de nuevo.')
      }

      const { productId, variantId, cantidad } = item as {
        productId?: unknown
        variantId?: unknown
        cantidad?: unknown
      }

      if (typeof productId !== 'string' || productId.trim() === '') {
        return malaSolicitud('Hay un producto inválido en el carrito. Vacialo y agregalo de nuevo.')
      }
      if (typeof variantId !== 'string' || variantId.trim() === '') {
        return malaSolicitud('Falta elegir la talla o medida de un producto del carrito.')
      }
      // Entero >= 1. Un 1.5 o un -2 acá terminaría en un cobro absurdo.
      if (typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad < 1) {
        return malaSolicitud('La cantidad de un producto del carrito no es válida.')
      }

      lines.push({ productId, variantId, cantidad })
    }

    /* ---------------------------------------------------------------------
       3. Validación de los datos del comprador.
       Los 6 campos son obligatorios: sin dirección completa no hay despacho.
       --------------------------------------------------------------------- */
    if (typeof buyerRaw !== 'object' || buyerRaw === null) {
      return malaSolicitud('Faltan tus datos de contacto y despacho.')
    }

    const buyerObj = buyerRaw as Record<string, unknown>

    for (const campo of CAMPOS_BUYER) {
      const valor = buyerObj[campo.key]
      if (typeof valor !== 'string' || valor.trim() === '') {
        return malaSolicitud(`Completá tu ${campo.label}.`)
      }
    }

    const buyer: Buyer = {
      nombre: String(buyerObj.nombre).trim(),
      email: String(buyerObj.email).trim(),
      telefono: String(buyerObj.telefono).trim(),
      direccion: String(buyerObj.direccion).trim(),
      comuna: String(buyerObj.comuna).trim(),
      ciudad: String(buyerObj.ciudad).trim(),
    }

    if (!EMAIL_RE.test(buyer.email)) {
      return malaSolicitud('Revisá tu email: no parece una dirección válida.')
    }

    /* ---------------------------------------------------------------------
       4. EL TOTAL SALE SIEMPRE DE ACÁ.
       calcularTotal() recorre el catálogo del servidor, multiplica precio por
       cantidad y valida stock. El cliente NUNCA manda el total ni los precios:
       si lo hiciera, cualquiera podría abrir devtools y pagar $350 por una
       tabla de $62.000.
       El error que devuelve ya está en español y menciona el stock, así que se
       reenvía tal cual al formulario.
       --------------------------------------------------------------------- */
    const { total, error } = calcularTotal(lines)
    if (error) {
      return malaSolicitud(error)
    }

    /* ---------------------------------------------------------------------
       5. Orden local en estado 'pendiente'.
       Se crea ANTES de hablar con Flow: si Flow responde y nosotros no
       tenemos la orden guardada, el webhook llega a una orden inexistente.
       --------------------------------------------------------------------- */
    const commerceOrder = generateCommerceOrder()
    createOrder({ commerceOrder, lines, total, buyer })

    /* ---------------------------------------------------------------------
       6. URLs de callback.
       getSiteUrl() resuelve la base para los tres entornos sin tocar código:
       tu dominio o el túnel via NEXT_PUBLIC_SITE_URL, y en Vercel las
       variables que la plataforma inyecta sola. Ver `src/lib/site-url.ts`.
       --------------------------------------------------------------------- */
    const base = getSiteUrl()

    if (esLocal(base)) {
      // No es un error fatal: el checkout de Flow funciona y el cobro se hace.
      // Lo que se pierde es el webhook, así que la orden queda 'pendiente' para
      // siempre y el comprador ve "pago no confirmado" aunque pagó.
      console.warn(
        `[create-payment] NEXT_PUBLIC_SITE_URL apunta a ${base}. Flow hace el POST del ` +
          `webhook desde internet, así que no va a poder llamar a /api/flow/confirmation ` +
          `y la orden ${commerceOrder} va a quedar pendiente. Levantá un túnel ` +
          `(npx cloudflared tunnel --url http://localhost:3000), pegá la URL pública en ` +
          `NEXT_PUBLIC_SITE_URL y reiniciá el dev server.`,
      )
    }

    const urlConfirmation = `${base}/api/flow/confirmation`
    const urlReturn = `${base}/confirmacion?order=${commerceOrder}`

    /* ---------------------------------------------------------------------
       7. Creación del pago en Flow.
       `optional` viaja como metadata: si alguna vez hay que rastrear un pago
       desde el panel de Flow, el commerceOrder está ahí a la vista.
       --------------------------------------------------------------------- */
    const { redirectUrl, token, flowOrder } = await createPayment({
      commerceOrder,
      subject: `Scronter — orden ${commerceOrder}`,
      amount: total,
      email: buyer.email,
      urlConfirmation,
      urlReturn,
      optional: { commerceOrder },
    })

    // 8. Guardamos token y flowOrder para poder reconciliar después si el
    // webhook se pierde (ver getStatusByCommerceOrder en lib/flow/client.ts).
    attachFlowToken(commerceOrder, token, flowOrder)

    return NextResponse.json({ redirectUrl, commerceOrder })
  } catch (err) {
    /* ---------------------------------------------------------------------
       9. Cualquier otra falla es nuestra.
       El detalle real (incluido el cuerpo del error de Flow, que puede traer
       credenciales o firmas) va SOLO al log del servidor. Al cliente le llega
       un mensaje genérico: filtrar el error interno de una pasarela de pago es
       regalarle información a quien esté sondeando el endpoint.
       --------------------------------------------------------------------- */
    console.error('[create-payment] falló la creación del pago:', err)
    return NextResponse.json(
      { error: 'No pudimos iniciar el pago. Intentá de nuevo en unos minutos.' },
      { status: 500 },
    )
  }
}
