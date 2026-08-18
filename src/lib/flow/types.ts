import type { OrderStatus } from '@/types'

/** Respuesta de POST /payment/create */
export interface FlowCreateResponse {
  /** Base del checkout de Flow. Hay que concatenarle "?token=" + token. */
  url: string
  token: string
  flowOrder: number
}

/**
 * Respuesta de GET /payment/getStatus
 *
 * `status` es numérico y es LA fuente de verdad del pago:
 *   1 = pendiente de pago
 *   2 = pagada
 *   3 = rechazada
 *   4 = anulada
 *
 * Verificado contra developers.flow.cl (ago 2026). Solo `2` significa cobrado:
 * cualquier otro valor NO debe despachar la orden.
 */
export interface FlowStatusResponse {
  flowOrder: number
  commerceOrder: string
  requestDate: string
  status: 1 | 2 | 3 | 4
  subject: string
  currency: string
  amount: number
  payer: string
  paymentData?: {
    date?: string
    media?: string
    conversionRate?: number
    amount?: number
    fee?: number
    balance?: number
    transferDate?: string
  }
}

/** Cuando Flow responde con error devuelve esta forma en vez de la esperada. */
export interface FlowError {
  code: number
  message: string
}

/** Traduce el `status` numérico de Flow a nuestro estado interno. */
export function mapFlowStatus(status: number): OrderStatus {
  switch (status) {
    case 2:
      return 'pagada'
    case 3:
      return 'rechazada'
    case 4:
      return 'anulada'
    case 1:
    default:
      // Ante un valor desconocido tratamos la orden como pendiente y NO
      // despachamos. Es el default seguro: peor es marcar pagada una orden
      // que no lo está.
      return 'pendiente'
  }
}
