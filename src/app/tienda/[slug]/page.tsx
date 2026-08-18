import type { Metadata } from 'next'
import type { JSX } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllProducts, getProductBySlug, totalStock } from '@/data/products'
import { formatCLP } from '@/lib/format'
import { CATEGORIA_LABEL } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Placeholder } from '@/components/ui/Placeholder'
import { AddToCart } from '@/components/product/AddToCart'

/* ============================================================================
   SCRONTER — DETALLE DE PRODUCTO  ·  /tienda/[slug]
   ============================================================================

   Server Component. Lo único que corre en el cliente es <AddToCart />, que es
   donde hay estado (variante, cantidad). El texto, el precio y la metadata se
   renderizan en el servidor, así el detalle es indexable y no depende de JS.
   ============================================================================ */

/** Prerenderiza las 16 fichas en build. El catálogo es estático, así que no hay
 *  razón para resolver el slug en cada visita. Cuando esto venga de una DB,
 *  cambiá el cuerpo por el fetch de slugs y el resto de la página no se toca. */
export function generateStaticParams(): Array<{ slug: string }> {
  return getAllProducts().map((p) => ({ slug: p.slug }))
}

/* En Next 15 `params` es una Promise, tanto acá como en el componente. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const producto = getProductBySlug(slug)

  // generateMetadata corre antes del componente: si el slug no existe todavía no
  // se llamó a notFound(), así que hay que devolver algo válido igual.
  if (!producto) return { title: 'Producto no encontrado · Scronter' }

  return {
    title: `${producto.nombre} · Scronter`,
    description: producto.descripcionCorta,
    openGraph: {
      title: `${producto.nombre} · Scronter`,
      description: producto.descripcionCorta,
      // TODO: reemplazar por la foto real del producto cuando exista
      // (/public/images/...). Hoy no se declara imagen para no publicar una
      // URL que devuelve 404.
    },
  }
}

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<JSX.Element> {
  const { slug } = await params
  const producto = getProductBySlug(slug)

  // notFound() corta la ejecución (devuelve never), así que abajo `producto` ya
  // está tipado como Product sin necesidad de un non-null assertion.
  if (!producto) notFound()

  const agotado = totalStock(producto) === 0
  const categoriaLabel = CATEGORIA_LABEL[producto.categoria]

  // Las tablas son largas y verticales; el resto se lee mejor en cuadrado.
  const ratio = producto.categoria === 'tablas' ? 'portrait' : 'square'

  // El contenedor raíz es un <div>, no un <main>: el landmark <main> lo pone el
  // layout. Dos <main> anidados es HTML inválido y confunde a los lectores de
  // pantalla, que esperan encontrar uno solo por documento.
  return (
    <div className="shell py-8 lg:py-12">
      {/* Migas: el camino de vuelta a la categoría es lo primero que se busca
          después de descartar un producto. */}
      <nav aria-label="Migas de pan" className="mb-6 text-xs uppercase tracking-widest text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/tienda" className="hover:text-accent">
              Tienda
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/tienda?categoria=${producto.categoria}`} className="hover:text-accent">
              {categoriaLabel}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink">{producto.nombre}</li>
        </ol>
      </nav>

      {/* Móvil: una columna, imagen arriba. lg: imagen fija a la izquierda e info
          a la derecha. */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          {/* La foto sale de producto.imagen; en null se dibuja el bloque.
              priority porque en el detalle esta es la imagen principal y la
              primera que se ve al cargar. Ver IMAGENES.md */}
          <Placeholder
            label={producto.nombre}
            src={producto.imagen}
            ratio={ratio}
            className="border border-line"
            priority
          />
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-muted">{categoriaLabel}</span>
            {agotado && <Badge tone="danger">Agotado</Badge>}
            {!agotado && producto.destacado && <Badge tone="accent">Destacado</Badge>}
          </div>

          <h1 className="font-display text-3xl leading-none sm:text-4xl lg:text-5xl">
            {producto.nombre}
          </h1>

          {/* El precio en acento es el único bloque de color de la ficha: si se
              pinta más de una cosa en flúor, deja de leerse como el dato clave. */}
          <p className="tnum mt-4 text-2xl text-accent sm:text-3xl">{formatCLP(producto.precio)}</p>

          <p className="mt-4 text-sm text-muted">{producto.descripcionCorta}</p>

          <hr className="my-6 border-line" />

          <AddToCart producto={producto} />

          <hr className="my-6 border-line" />

          <section>
            <h2 className="text-sm uppercase tracking-widest text-muted">Detalle</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink">{producto.descripcion}</p>
          </section>

          <section className="mt-6 border border-line bg-surface p-4">
            <h2 className="text-xs uppercase tracking-widest text-muted">Despacho</h2>
            {/* TODO: reemplazar por las condiciones reales de despacho y cambio
                (plazos, costo por región, política de devolución). */}
            <ul className="mt-3 space-y-1 text-sm text-muted">
              <li>Despacho a todo Chile. El costo se calcula en el checkout.</li>
              <li>Cambios dentro de 30 días con boleta y etiqueta original.</li>
              <li>Pago con tarjeta o transferencia vía Flow.</li>
            </ul>
          </section>
        </div>
      </div>

      <div className="mt-12 border-t border-line pt-6">
        <Link
          href="/tienda"
          className="text-xs uppercase tracking-widest text-muted hover:text-accent"
        >
          ← Volver a la tienda
        </Link>
      </div>
    </div>
  )
}
