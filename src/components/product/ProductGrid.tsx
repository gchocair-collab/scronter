import type { JSX } from 'react'

import { ProductCard } from '@/components/product/ProductCard'
import type { Product } from '@/types'

/**
 * Grilla de productos. Mobile-first: 2 columnas en teléfono, 3 desde sm y 4
 * desde lg. Dos columnas en móvil (y no una) porque en una tienda de ropa el
 * visitante escanea comparando, y una sola columna obliga a scrollear de más.
 */
export function ProductGrid({ productos }: { productos: Product[] }): JSX.Element {
  if (productos.length === 0) {
    return (
      <div className="border border-line bg-surface p-8 text-center sm:p-12">
        <p className="font-display text-lg uppercase text-ink">
          No hay productos en esta categoría.
        </p>
        <p className="mt-2 text-sm text-muted">
          Probá con otra categoría o mirá el catálogo completo.
        </p>
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {productos.map((producto) => (
        <li key={producto.id} className="flex">
          {/* w-full sobre la card: el <li> es flex para que la card estire y
              todas las de la fila terminen con la misma altura. */}
          <ProductCard producto={producto} />
        </li>
      ))}
    </ul>
  )
}
