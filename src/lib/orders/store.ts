import type { Buyer, CartLine, Order, OrderStatus } from '@/types'
import { getProductById } from '@/data/products'

/* ============================================================================
   SCRONTER — PERSISTENCIA DE ÓRDENES
   ============================================================================

   ⚠️  LIMITACIÓN IMPORTANTE, LEER ANTES DE PRODUCCIÓN
   ────────────────────────────────────────────────────────────────────────────
   Esta implementación guarda las órdenes en un Map EN MEMORIA. Sirve para
   desarrollo local y nada más.

   En producción sobre serverless (Vercel, Netlify) se rompe, y de una forma
   que no es obvia: cada invocación puede levantar una instancia distinta del
   proceso. El checkout crea la orden en la instancia A, y minutos después el
   webhook de Flow aterriza en la instancia B, que tiene un Map vacío — así
   que la orden "no existe" y el pago queda sin registrar. Un reinicio o un
   cold start produce el mismo resultado.

   👉 TODO: reemplazar por una base de datos real antes de ir a producción.
      La interfaz de abajo (createOrder / getOrder / markOrderStatus) está
      pensada para eso: cambiás SOLO los cuerpos de estas cuatro funciones y
      ni el checkout ni el webhook se enteran.

      Opciones que encajan bien con Next en Chile:
        · Supabase (Postgres gestionado, tiene tier gratis)
        · Vercel Postgres / Neon
        · Prisma + cualquier Postgres

      Esquema mínimo equivalente a este archivo:

        create table orders (
          commerce_order text primary key,
          lines          jsonb not null,
          total          integer not null,
          buyer          jsonb not null,
          status         text not null default 'pendiente',
          flow_token     text,
          flow_order     integer,
          medio_pago     text,
          created_at     timestamptz not null default now(),
          paid_at        timestamptz
        );
   ============================================================================ */

const ordenes = new Map<string, Order>()

/**
 * Genera un `commerceOrder` único.
 *
 * Formato: SCR-<timestamp en base36>-<4 chars aleatorios>
 * Ej.: SCR-m0k2p9x-4f7a  (23 caracteres, bien por debajo del límite de 40)
 *
 * Flow rechaza un `commerceOrder` repetido, así que no puede derivarse solo
 * del carrito: si alguien intenta pagar dos veces tras un rechazo, el segundo
 * intento necesita un ID nuevo.
 */
export function generateCommerceOrder(): string {
  const ts = Date.now().toString(36)
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 4)
  return `SCR-${ts}-${rand}`
}

/**
 * Calcula el total EN EL SERVIDOR a partir de las líneas del carrito.
 *
 * Este es el control de seguridad más importante de todo el checkout. El
 * cliente manda IDs y cantidades, nunca precios ni total. Si se confiara en un
 * total enviado por el navegador, cualquiera podría abrir devtools y pagar $350
 * por una tabla de $62.000.
 *
 * Además valida stock, así que una línea con más unidades de las disponibles
 * no llega nunca a generar un cobro.
 */
export function calcularTotal(lines: CartLine[]): { total: number; error?: string } {
  if (lines.length === 0) {
    return { total: 0, error: 'El carrito está vacío.' }
  }

  let total = 0

  for (const line of lines) {
    const producto = getProductById(line.productId)
    if (!producto) {
      return { total: 0, error: `Producto no encontrado: ${line.productId}` }
    }

    const variante = producto.variantes.find((v) => v.id === line.variantId)
    if (!variante) {
      return { total: 0, error: `Variante no encontrada: ${line.variantId} de ${producto.nombre}` }
    }

    if (!Number.isInteger(line.cantidad) || line.cantidad < 1) {
      return { total: 0, error: `Cantidad inválida para ${producto.nombre}.` }
    }

    if (line.cantidad > variante.stock) {
      return {
        total: 0,
        error: `Sin stock suficiente de ${producto.nombre} talla ${variante.label}. Quedan ${variante.stock}.`,
      }
    }

    total += producto.precio * line.cantidad
  }

  return { total }
}

export function createOrder(params: {
  commerceOrder: string
  lines: CartLine[]
  total: number
  buyer: Buyer
}): Order {
  const orden: Order = {
    commerceOrder: params.commerceOrder,
    lines: params.lines,
    total: params.total,
    buyer: params.buyer,
    status: 'pendiente',
    createdAt: new Date().toISOString(),
  }
  ordenes.set(orden.commerceOrder, orden)
  return orden
}

export function getOrder(commerceOrder: string): Order | undefined {
  return ordenes.get(commerceOrder)
}

/** Guarda el token que devolvió Flow, para poder reconciliar más adelante. */
export function attachFlowToken(
  commerceOrder: string,
  token: string,
  flowOrder: number,
): void {
  const orden = ordenes.get(commerceOrder)
  if (!orden) return
  orden.flowToken = token
  orden.flowOrder = flowOrder
  ordenes.set(commerceOrder, orden)
}

/**
 * Marca el estado final de la orden. La llama el webhook, nunca la página de
 * retorno.
 *
 * TODO: acá va el resto del fulfillment cuando tengas DB —
 * descontar stock, mandar el mail de confirmación, avisar a despacho.
 * Ojo: el webhook de Flow tiene 15 segundos para responder 200, así que
 * cualquier trabajo lento (mails, PDFs) debería encolarse, no hacerse inline.
 */
export function markOrderStatus(
  commerceOrder: string,
  status: OrderStatus,
  extra?: { medioPago?: string },
): Order | undefined {
  const orden = ordenes.get(commerceOrder)
  if (!orden) return undefined

  orden.status = status
  if (extra?.medioPago) orden.medioPago = extra.medioPago
  if (status === 'pagada' && !orden.paidAt) {
    orden.paidAt = new Date().toISOString()
  }

  ordenes.set(commerceOrder, orden)
  return orden
}
