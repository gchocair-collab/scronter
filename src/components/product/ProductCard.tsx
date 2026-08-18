import Link from 'next/link'
import type { JSX } from 'react'

import { Badge } from '@/components/ui/Badge'
import { Placeholder } from '@/components/ui/Placeholder'
import { totalStock } from '@/data/products'
import { cn, formatCLP } from '@/lib/format'
import { CATEGORIA_LABEL, type Product } from '@/types'

/* Umbral de "últimas unidades". Vive acá y no en la data porque es una decisión
   de vitrina, no del catálogo: si mañana querés avisar antes, se cambia el 3. */
const STOCK_BAJO = 3

/**
 * Card de producto para las grillas (catálogo y destacados del home).
 *
 * Server Component: no hay estado ni handlers, lo único interactivo es el
 * <Link>. Así la grilla completa viaja como HTML y no arrastra JS al cliente.
 */
export function ProductCard({ producto }: { producto: Product }): JSX.Element {
  const stock = totalStock(producto)
  const agotado = stock === 0
  const ultimas = !agotado && stock <= STOCK_BAJO

  return (
    <Link
      href={`/tienda/${producto.slug}`}
      /* `group` habilita los hovers de adentro (nombre) desde el contenedor: el
         mouse en cualquier parte de la card enciende todo a la vez.
         El padding deja el borde del <Placeholder> como marco interior, en vez
         de pegarlo al borde de la card y que se lean dos líneas de 1px. */
      className={cn(
        'group flex w-full flex-col border border-line bg-surface p-2 sm:p-3',
        'transition-colors hover:border-accent/40',
      )}
    >
      <div className="relative">
        {/* La foto sale de producto.imagen. Si está en null, <Placeholder>
            dibuja el bloque con el nombre. No hay que tocar nada acá para
            agregar fotos: se cambia el null en data/products.ts. Ver IMAGENES.md */}
        <Placeholder
          label={producto.nombre}
          src={producto.imagen}
          ratio="square"
          // Agotado se ve apagado, no escondido: el visitante igual quiere
          // saber que el modelo existe.
          className={cn(agotado && 'opacity-40')}
        />

        {(agotado || ultimas) && (
          <div className="absolute left-2 top-2">
            {agotado ? (
              <Badge tone="danger">Agotado</Badge>
            ) : (
              <Badge tone="warn">Últimas unidades</Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 pt-3">
        <span className="text-xs uppercase tracking-widest text-muted">
          {CATEGORIA_LABEL[producto.categoria]}
        </span>

        {/* h3 y no h2: la card siempre vive dentro de una sección que ya tiene
            su encabezado, así el outline no se salta un nivel. */}
        <h3 className="text-sm leading-tight text-ink transition-colors group-hover:text-accent sm:text-base">
          {producto.nombre}
        </h3>

        {/* mt-auto empuja el precio al piso de la card: con nombres de largo
            distinto, todos los precios de la fila quedan a la misma altura. */}
        <span
          className={cn(
            'tnum mt-auto pt-2 font-display text-base tracking-wide sm:text-lg',
            agotado ? 'text-muted line-through' : 'text-ink',
          )}
        >
          {formatCLP(producto.precio)}
        </span>
      </div>
    </Link>
  )
}
