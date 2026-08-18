/**
 * Resuelve la URL pública del sitio.
 *
 * Se usa en dos lugares que no pueden equivocarse:
 *   · `app/layout.tsx` → `metadataBase`, que absolutiza las imágenes de Open
 *     Graph. Sin una base correcta, las previsualizaciones en WhatsApp o
 *     Instagram salen sin imagen.
 *   · `api/flow/create-payment` → `urlConfirmation` y `urlReturn`, que son las
 *     direcciones a las que Flow llama y redirige. Si apuntan al lugar
 *     equivocado, el pago se cobra pero la orden nunca se confirma.
 *
 * ORDEN DE PRECEDENCIA (la primera que exista, gana):
 *
 * 1. `NEXT_PUBLIC_SITE_URL` — tu dominio real, o la URL del túnel cuando
 *    pruebas Flow en local. Configurada a mano, así que manda sobre todo.
 *
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` — el dominio estable de producción que
 *    Vercel inyecta solo. Es el que conviene en producción, porque no cambia
 *    entre deploys.
 *
 * 3. `VERCEL_URL` — la URL específica de ESTE deploy (cambia en cada push).
 *    Sirve para las preview deployments, donde es justamente lo que se quiere.
 *
 * 4. `http://localhost:3000` — desarrollo local.
 *
 * Los pasos 2 y 3 existen para que el deploy en Vercel funcione sin configurar
 * ninguna variable: si no existieran, el sitio desplegado creería que vive en
 * localhost y las URLs de callback de Flow serían inservibles.
 *
 * Nota: `VERCEL_*` solo está disponible del lado del servidor. Este módulo se
 * usa únicamente en Server Components y en rutas de API, así que está bien.
 */
export function getSiteUrl(): string {
  // NEXT_PUBLIC_SITE_URL se escribe a mano y ya incluye el esquema
  // (http:// o https://), así que solo hay que sacarle la barra final.
  const explicita = process.env.NEXT_PUBLIC_SITE_URL
  if (explicita?.trim()) return sinBarraFinal(explicita)

  // Las variables de Vercel vienen SIN esquema ("scronter.vercel.app"), así que
  // hay que agregarle https://. Se le saca un esquema por si Vercel algún día
  // cambia el formato: así no queda "https://https://...".
  const produccion = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (produccion?.trim()) return `https://${soloHost(produccion)}`

  const deploy = process.env.VERCEL_URL
  if (deploy?.trim()) return `https://${soloHost(deploy)}`

  return 'http://localhost:3000'
}

/** Recorta espacios y barras finales, conservando el esquema. */
function sinBarraFinal(valor: string): string {
  return valor.trim().replace(/\/+$/, '')
}

/** Deja solo el host: sin espacios, sin esquema y sin barra final. */
function soloHost(valor: string): string {
  return sinBarraFinal(valor).replace(/^https?:\/\//, '')
}

/**
 * `true` si la URL resuelta es local, o sea si Flow no va a poder alcanzar el
 * webhook desde internet. Se usa para avisar en el log en vez de fallar en
 * silencio: el cobro se hace igual, pero la orden queda pendiente para siempre.
 */
export function esLocal(url: string): boolean {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(url)
}
