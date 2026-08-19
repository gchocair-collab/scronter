import type { Metadata } from 'next'

import { CategoryFilter } from '@/components/product/CategoryFilter'
import { ProductGrid } from '@/components/product/ProductGrid'
import { getProductsByCategory, getVisibleProducts } from '@/data/products'
import { CATEGORIA_LABEL, CATEGORIAS_ACTIVAS, type Category } from '@/types'

export const metadata: Metadata = {
  title: 'Tienda | Scronter',
  description:
    'Catálogo completo Scronter: tablas, gorros, polerones, poleras y zapatillas de skate. Despacho a todo Chile.',
}

/**
 * Valida el valor crudo de la query string contra las categorías ACTIVAS
 * (no contra todas las que existen en el tipo — ver `CATEGORIAS_ACTIVAS`).
 *
 * Cualquiera puede escribir /tienda?categoria=cualquiercosa a mano, incluida
 * una categoría desactivada. Si nos fiáramos del string, `getProductsByCategory`
 * mostraría productos que en el resto del sitio están ocultos; ante cualquier
 * valor que no esté activo preferimos caer a "todas".
 *
 * El cast a readonly string[] es solo para poder comparar un string arbitrario
 * contra el array tipado sin que TypeScript exija que ya sea un Category.
 */
function parseCategoria(valor: string | undefined): Category | 'todas' {
  if (valor && (CATEGORIAS_ACTIVAS as readonly string[]).includes(valor)) {
    return valor as Category
  }
  return 'todas'
}

export default async function Page({
  searchParams,
}: {
  // En Next 15 searchParams es una Promise: hay que await-earla antes de leerla.
  searchParams: Promise<{ categoria?: string }>
}) {
  const { categoria } = await searchParams
  const activa = parseCategoria(categoria)

  const productos = activa === 'todas' ? getVisibleProducts() : getProductsByCategory(activa)
  const titulo = activa === 'todas' ? 'Todo el catálogo' : CATEGORIA_LABEL[activa]

  return (
    <div className="shell py-8 sm:py-12">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted">Tienda</p>
        <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl">{titulo}</h1>
      </header>

      <div className="mt-6 sm:mt-8">
        <CategoryFilter activa={activa} />
      </div>

      {/* El contador va después del filtro a propósito: así se lee como el
          resultado del filtro aplicado y no como parte del título. */}
      <p className="tnum mt-4 text-xs uppercase tracking-widest text-muted">
        {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
      </p>

      <div className="mt-4 sm:mt-6">
        <ProductGrid productos={productos} />
      </div>
    </div>
  )
}
