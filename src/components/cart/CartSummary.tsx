'use client'

import Link from 'next/link'
import { useCartSubtotal, useCartHydrated, useCartCount } from '@/store/cart'
import { formatCLP } from '@/lib/format'
import { Button } from '@/components/ui/Button'

/* ============================================================================
   Resumen del carrito.

   El subtotal es SOLO informativo: el monto que se cobra lo recalcula el
   servidor en `lib/orders/store.ts` a partir de los IDs. Si alguien edita el
   localStorage, el precio del cobro no cambia.

   El despacho no se suma acá porque depende de la comuna, que se pide recién
   en el checkout. Se dice explícitamente para que el total no parezca final.
   ============================================================================ */

export function CartSummary({
  ctaHref,
  ctaLabel = 'Ir a pagar',
}: {
  ctaHref?: string
  ctaLabel?: string
}) {
  const hidratado = useCartHydrated()
  const subtotal = useCartSubtotal()
  const unidades = useCartCount()

  // Antes de hidratar el subtotal es 0 por falta de datos, no porque el carrito
  // esté vacío: se muestra un guion en vez de "$0", que sería un dato falso.
  const vacio = unidades === 0
  const ctaHabilitado = hidratado && !vacio

  return (
    <aside className="border border-line bg-surface p-5 rounded sm:p-6">
      <h2 className="text-lg sm:text-xl">Resumen</h2>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">Subtotal</dt>
          <dd className="font-display text-xl text-ink tnum">
            {hidratado ? formatCLP(subtotal) : '—'}
          </dd>
        </div>

        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted">Despacho</dt>
          <dd className="text-xs uppercase tracking-widest text-muted">A calcular</dd>
        </div>
      </dl>

      <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-muted">
        El costo de despacho se calcula en el siguiente paso, según la comuna de entrega. El pago se
        procesa con Flow.
      </p>

      {ctaHref ? (
        ctaHabilitado ? (
          // Es navegación, así que va como link y no como <button>: se puede
          // abrir en otra pestaña y funciona sin JS.
          <Link
            href={ctaHref}
            className="mt-5 flex w-full items-center justify-center rounded bg-accent px-5 py-3 font-display text-sm uppercase tracking-widest text-accent-ink transition-colors hover:bg-accent-hover"
          >
            {ctaLabel}
          </Link>
        ) : (
          // Con el carrito vacío el CTA existe pero no lleva a ninguna parte:
          // un <button disabled> comunica el estado y no es focusable.
          <Button className="mt-5 w-full" disabled aria-disabled>
            {ctaLabel}
          </Button>
        )
      ) : null}

      {hidratado && vacio ? (
        <p className="mt-3 text-center text-xs uppercase tracking-widest text-muted">
          Agregá productos para continuar
        </p>
      ) : null}
    </aside>
  )
}
