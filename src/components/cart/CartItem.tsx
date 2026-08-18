'use client'

import Link from 'next/link'
import type { CartLineView } from '@/types'
import { CATEGORIA_LABEL } from '@/types'
import { useCart } from '@/store/cart'
import { formatCLP, cn } from '@/lib/format'
import { Placeholder } from '@/components/ui/Placeholder'
import { Button } from '@/components/ui/Button'
import { QuantityStepper } from '@/components/product/QuantityStepper'

/* ============================================================================
   Una línea del carrito.

   Recibe la línea ya resuelta (`CartLineView`, con producto y variante
   adentro) en vez de resolverla acá: así el catálogo se consulta una sola vez
   en `useCartLines()` y no una vez por fila.
   ============================================================================ */

export function CartItem({ linea }: { linea: CartLineView }) {
  // Se seleccionan las acciones sueltas, no el store completo: las acciones son
  // referencias estables, así que esta fila no se re-renderiza cuando cambia
  // OTRA fila del carrito.
  const setCantidad = useCart((s) => s.setCantidad)
  const removeLine = useCart((s) => s.removeLine)

  const { producto, variante, cantidad, subtotal } = linea
  const rotuloVariante = producto.tipoVariante === 'medida' ? 'Medida' : 'Talla'

  // El techo real es el stock de ESA variante, no del producto: podés tener 12
  // poleras y cero en L.
  const enElTope = cantidad >= variante.stock

  return (
    <li className="flex gap-3 border-b border-line py-4 last:border-b-0 sm:gap-4 sm:py-5">
      {/* TODO: reemplazar por la foto real del producto cuando exista el asset.
          Mientras no haya archivo en /public, next/image rompería el build. */}
      <Link
        href={`/tienda/${producto.slug}`}
        className="w-20 shrink-0 sm:w-24"
        aria-label={`Ver ${producto.nombre}`}
      >
        <Placeholder label={producto.nombre} ratio="square" className="rounded-sm" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:gap-4">
        {/* Datos del producto */}
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-widest text-muted">
            {CATEGORIA_LABEL[producto.categoria]}
          </p>

          <h3 className="mt-1 truncate text-base leading-tight sm:text-lg">
            <Link href={`/tienda/${producto.slug}`} className="hover:text-accent">
              {producto.nombre}
            </Link>
          </h3>

          <p className="mt-1 text-sm text-muted">
            <span className="uppercase tracking-widest text-xs">{rotuloVariante}</span>{' '}
            <span className="text-ink">{variante.label}</span>
          </p>

          <p className="mt-1 text-sm text-muted tnum">{formatCLP(producto.precio)} c/u</p>
        </div>

        {/* Cantidad + totales. En móvil va abajo del nombre; en sm+ a la derecha. */}
        <div className="flex items-end justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
          <div className="flex flex-col gap-1">
            <QuantityStepper
              valor={cantidad}
              max={variante.stock}
              onChange={(n) => setCantidad(producto.id, variante.id, n)}
            />
            {/* Se avisa el tope en vez de dejar el "+" muerto sin explicación. */}
            <p
              className={cn(
                'text-xs uppercase tracking-widest',
                enElTope ? 'text-warn' : 'invisible',
              )}
              aria-live="polite"
            >
              {enElTope ? `Máx. ${variante.stock}` : 'Máx.'}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <p className="font-display text-lg tnum sm:text-xl">{formatCLP(subtotal)}</p>
            <Button
              variant="danger"
              size="sm"
              onClick={() => removeLine(producto.id, variante.id)}
              // El aria-label nombra producto y variante: con varias filas
              // iguales, un "Eliminar" pelado no dice cuál se está borrando.
              aria-label={`Eliminar ${producto.nombre} ${rotuloVariante.toLowerCase()} ${variante.label} del carrito`}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </div>
    </li>
  )
}
