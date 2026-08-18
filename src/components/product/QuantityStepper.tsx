'use client'

import type { JSX } from 'react'
import { cn } from '@/lib/format'

/* ============================================================================
   SCRONTER — SELECTOR DE CANTIDAD
   ============================================================================

   Se maneja con dos botones y no con un <input type="number"> a propósito: en
   móvil el input numérico abre el teclado, permite pegar texto y deja escribir
   "007" o "-3", que después hay que sanear. Con − / + el valor nunca sale del
   rango [1, max] y no hay estado intermedio inválido.

   El componente es controlado (recibe `valor` y avisa por `onChange`): quien lo
   usa —AddToCart, CartItem— ya tiene que conocer la cantidad para calcular
   subtotales, así que duplicar el estado acá solo desincronizaría.
   ============================================================================ */

export function QuantityStepper({
  valor,
  max,
  onChange,
  className,
}: {
  valor: number
  max: number
  onChange: (n: number) => void
  className?: string
}): JSX.Element {
  // El piso es 1: llegar a 0 sería "eliminar", y eso lo decide el carrito con su
  // propio botón, no este control.
  const puedeBajar = valor > 1
  // Con max 0 (sin variante elegida o variante agotada) los dos botones quedan
  // muertos, en vez de dejar sumar unidades que después el store recorta.
  const puedeSubir = valor < max

  const boton =
    'flex h-10 w-10 items-center justify-center border-line text-lg leading-none ' +
    'transition-colors hover:bg-raised hover:text-accent ' +
    'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ' +
    'disabled:hover:text-ink'

  return (
    <div className={cn('inline-flex items-center border border-line bg-surface', className)}>
      <button
        type="button"
        onClick={() => onChange(valor - 1)}
        disabled={!puedeBajar}
        aria-label="Quitar una unidad"
        className={cn(boton, 'border-r')}
      >
        {/* Signo menos real (−), no guion: el guion se ve más chico y desalineado. */}
        −
      </button>

      {/* aria-live avisa el número nuevo a un lector de pantalla sin tener que
          mover el foco fuera del botón que se está apretando. */}
      <span aria-live="polite" className="tnum w-12 text-center text-sm tabular-nums">
        {valor}
      </span>

      <button
        type="button"
        onClick={() => onChange(valor + 1)}
        disabled={!puedeSubir}
        aria-label="Agregar una unidad"
        className={cn(boton, 'border-l')}
      >
        +
      </button>
    </div>
  )
}
