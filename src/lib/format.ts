/**
 * Formatea un entero CLP como "$45.000".
 *
 * Usa es-CL a propósito: el peso chileno separa miles con punto y no lleva
 * decimales. `maximumFractionDigits: 0` evita que un precio termine como
 * "$45.000,00", que en Chile se lee raro.
 */
export function formatCLP(monto: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(monto)
}

/** Une clases condicionalmente sin arrastrar una dependencia. */
export function cn(...clases: Array<string | false | null | undefined>): string {
  return clases.filter(Boolean).join(' ')
}
