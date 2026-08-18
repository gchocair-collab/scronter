import { NextRequest, NextResponse } from 'next/server'
import { getOrder } from '@/lib/orders/store'

/* ============================================================================
   GET /api/flow/status?order=SCR-xxx
   ============================================================================

   Lo consume la página /confirmacion para mostrarle al comprador en qué quedó
   su pago. Es de solo lectura: nunca cambia el estado de una orden. El único
   que puede marcar 'pagada' es el webhook, que sí verifica contra Flow.

   🔒 ENDPOINT SIN AUTENTICACIÓN
   El comprador llega acá con un commerceOrder en la URL y no hay sesión que
   validar. Como el commerceOrder es adivinable por fuerza bruta (formato
   conocido, timestamp + 4 caracteres), este endpoint devuelve el MÍNIMO
   necesario para pintar la pantalla:

     · NO devuelve `buyer` — nombre, email, teléfono y dirección son datos
       personales, y filtrarlos convertiría esto en un scraper de clientes.
     · NO devuelve `flowToken` — ese token permite consultar el pago contra la
       API de Flow. Exponerlo es exponer la transacción.
     · NO devuelve `lines` — no hace falta para el estado, y el detalle del
       pedido ya lo tiene el comprador en su carrito y en el mail.

   Si en el futuro se quiere mostrar el detalle completo del pedido, hay que
   pedir algo que solo el comprador sepa (el email de la orden) o mandarlo por
   mail, no ampliar esta respuesta.
   ============================================================================ */

// Lee estado mutable: si se cacheara, el comprador vería 'pendiente' para
// siempre aunque el webhook ya hubiera confirmado el pago.
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const commerceOrder = req.nextUrl.searchParams.get('order')

  if (!commerceOrder || commerceOrder.trim() === '') {
    return NextResponse.json({ error: 'Falta el número de orden.' }, { status: 400 })
  }

  const orden = getOrder(commerceOrder)

  if (!orden) {
    // Con el store en memoria un 404 también puede significar "el server se
    // reinició", no solo "esa orden no existe" (ver lib/orders/store.ts).
    return NextResponse.json({ error: 'No encontramos esa orden.' }, { status: 404 })
  }

  return NextResponse.json({
    commerceOrder: orden.commerceOrder,
    status: orden.status,
    total: orden.total,
    medioPago: orden.medioPago,
  })
}
