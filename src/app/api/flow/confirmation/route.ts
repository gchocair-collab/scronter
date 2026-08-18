import { NextRequest, NextResponse } from 'next/server'
import { getPaymentStatus } from '@/lib/flow/client'
import { mapFlowStatus } from '@/lib/flow/types'
import { getOrder, markOrderStatus } from '@/lib/orders/store'

/* ============================================================================
   POST /api/flow/confirmation  —  WEBHOOK DE FLOW
   ============================================================================

   Este es el endpoint que despacha. Es el único lugar donde una orden pasa a
   'pagada', y por eso tiene tres reglas duras:

   1. Flow manda application/x-www-form-urlencoded, NO JSON.
      Un req.json() acá tira una excepción y el webhook nunca funciona.

   2. El webhook NO es prueba de pago. Solo entrega un token. Cualquiera puede
      hacerle un POST a esta URL —  es pública por definición, Flow tiene que
      poder llamarla — así que el estado se verifica SIEMPRE contra la API de
      Flow con getPaymentStatus(). Sin ese paso, un POST falso con un token
      inventado alcanzaría para activar una orden.

   3. Responde 200 SIEMPRE, incluso si algo falla de nuestro lado.
      Flow espera un 200 en 15 segundos; si no lo recibe reintenta y manda
      alertas por mail al comercio. Y el cobro al comprador es válido igual: un
      500 nuestro no revierte nada, solo genera ruido. Los problemas se dejan en
      el log y la orden queda 'pendiente' para revisión manual.

   ⏱️  PRESUPUESTO: 15 SEGUNDOS.
   Todo el trabajo lento — mail de confirmación al comprador, PDF de la boleta,
   aviso a despacho, descuento de stock en la DB — debería ENCOLARSE (una cola,
   un job, un webhook interno), no hacerse inline acá. Dos llamadas HTTP lentas
   seguidas y ya te pasaste del límite.
   ============================================================================ */

// Webhook: nunca cacheado, siempre ejecutado.
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    /* ---------------------------------------------------------------------
       1. Leer el token del form-urlencoded. Un solo campo: `token`.
       --------------------------------------------------------------------- */
    const form = await req.formData()
    const token = form.get('token')

    if (typeof token !== 'string' || token.trim() === '') {
      console.error('[confirmation] POST sin token. ¿Alguien golpeando el endpoint a mano?')
      return new NextResponse('OK', { status: 200 })
    }

    /* ---------------------------------------------------------------------
       2. Verificación real contra Flow. Esta llamada va firmada con el
       SECRET_KEY, así que su respuesta sí es confiable: el token por sí solo
       no prueba nada.
       --------------------------------------------------------------------- */
    const pago = await getPaymentStatus(token)
    const commerceOrder = pago.commerceOrder

    const orden = getOrder(commerceOrder)
    if (!orden) {
      // En serverless esto es esperable con el store en memoria: el checkout
      // corrió en una instancia y el webhook aterrizó en otra.
      // TODO: desaparece cuando haya DB (ver lib/orders/store.ts).
      console.error(
        `[confirmation] Flow confirmó ${commerceOrder} pero la orden no existe en el store. ` +
          `Reconciliá a mano con getStatusByCommerceOrder('${commerceOrder}').`,
      )
      return new NextResponse('OK', { status: 200 })
    }

    /* ---------------------------------------------------------------------
       3. El monto que informa Flow tiene que coincidir con el total que
       calculamos y guardamos nosotros.
       Si no coincide, algo se manipuló o hay un bug de precios: NO se marca
       pagada. Se deja 'pendiente' y se logea el desajuste. Preferimos una orden
       que un humano tiene que mirar antes que despachar un pedido de $62.000
       cobrado en $350.
       --------------------------------------------------------------------- */
    if (pago.amount !== orden.total) {
      console.error(
        `[confirmation] DESAJUSTE DE MONTO en ${commerceOrder}: Flow informa ${pago.amount} ` +
          `y la orden vale ${orden.total}. Queda pendiente para revisión manual. NO se despacha.`,
      )
      return new NextResponse('OK', { status: 200 })
    }

    /* ---------------------------------------------------------------------
       4. Recién acá se toca el estado. mapFlowStatus() es conservador: ante un
       status desconocido devuelve 'pendiente' en vez de 'pagada'.
       --------------------------------------------------------------------- */
    const estado = mapFlowStatus(pago.status)
    markOrderStatus(commerceOrder, estado, { medioPago: pago.paymentData?.media })

    console.log(
      `[confirmation] ${commerceOrder} → ${estado}` +
        (pago.paymentData?.media ? ` (${pago.paymentData.media})` : ''),
    )

    /* ---------------------------------------------------------------------
       TODO: FULFILLMENT — falta todo esto cuando haya base de datos.
       Va después de marcar 'pagada', y ENCOLADO, no inline (15 segundos):
         · Descontar el stock de cada variante de orden.lines, en una
           transacción, para que dos compras simultáneas no vendan la misma
           última talla M.
         · Mandar el mail de confirmación al comprador (orden.buyer.email) con
           el detalle y el commerceOrder.
         · Notificar a despacho con la dirección (orden.buyer.direccion,
           comuna, ciudad) y el listado de productos.
         · Idempotencia: Flow puede reintentar el mismo webhook. Antes de
           descontar stock o mandar mails, chequeá que la orden no estuviera ya
           en 'pagada' — si no, descontás dos veces.
       --------------------------------------------------------------------- */

    return new NextResponse('OK', { status: 200 })
  } catch (err) {
    // Un error nuestro NO se le devuelve a Flow como error: el pago existe y es
    // válido. Se logea con detalle y se responde 200 para no disparar
    // reintentos ni alertas al comercio.
    console.error('[confirmation] el webhook falló, la orden queda sin actualizar:', err)
    return new NextResponse('OK', { status: 200 })
  }
}
