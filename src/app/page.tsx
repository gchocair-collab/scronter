import type { Metadata } from 'next'
import Link from 'next/link'

import { ProductGrid } from '@/components/product/ProductGrid'
import { Placeholder } from '@/components/ui/Placeholder'
import { getFeaturedProducts } from '@/data/products'
import { CATEGORIA_LABEL, CATEGORIAS } from '@/types'

export const metadata: Metadata = {
  title: 'Scronter — Skate shop',
  description:
    'Tablas, ropa y zapatillas de skate. Armado en Chile, probado en la calle.',
}

/* ============================================================================
   HOME
   ============================================================================

   Server Component puro: no hay estado ni interacción propia, así que no lleva
   'use client'. Todo el catálogo se lee en el servidor y llega ya renderizado.

   Los CTA que navegan son <Link> estilados como botón, NO <Button> envuelto en
   <Link>: un <button> dentro de un <a> es HTML inválido y rompe la navegación
   por teclado. Las clases replican la variante "primary"/"ghost" de Button.
   ============================================================================ */

/** Clases compartidas por los CTA. Se declaran una vez para que los dos CTA del
 *  hero tengan exactamente la misma caja y solo cambie el color. */
const ctaBase =
  'inline-flex items-center justify-center rounded px-6 py-3 font-display text-sm uppercase tracking-widest transition-colors'

/* ----------------------------------------------------------------------------
   IMÁGENES DEL HOME
   Estas dos no viven en el catálogo porque no pertenecen a ningún producto.
   `null` = todavía no hay foto, se dibuja el bloque con el rótulo.
   Para ponerlas: copiás el archivo a /public/images/ y reemplazás el null.
   Paso a paso en IMAGENES.md.
   ---------------------------------------------------------------------------- */

/** Banner de portada. Formato horizontal, mínimo 1920x1080. */
const HERO_IMAGEN: string | null = null

/** Una foto por categoría, cuadrada. Las que queden en null muestran el bloque. */
const IMAGEN_CATEGORIA: Record<string, string | null> = {
  tablas: null,
  gorros: null,
  polerones: null,
  poleras: null,
  zapatillas: null,
}

export default function HomePage() {
  const destacados = getFeaturedProducts()

  return (
    <>
      {/* ====================================================================
          1 · HERO
          ==================================================================== */}
      <section className="relative isolate overflow-hidden border-b border-line">
        {/* Banner de portada. Sale de HERO_IMAGEN (arriba de este archivo).
            Si querés un VIDEO en lugar de foto, este es el único lugar a
            cambiar: reemplazá el <Placeholder> por un <video autoPlay muted
            loop playsInline poster="..."> con las mismas clases.
            Ojo al cambiarlo: mantené el degradado de abajo, que es lo que le da
            contraste al título sobre cualquier imagen. */}
        <div className="absolute inset-0 -z-10">
          <Placeholder
            label="Banner Scronter"
            src={HERO_IMAGEN}
            ratio="wide"
            className="h-full w-full"
            // priority: es la imagen más grande y visible al cargar la home.
            priority
          />
          {/* Degradado desde el fondo de página hacia arriba: mantiene legible
              el texto sobre cualquier imagen que se ponga después, sin tener
              que retocar la foto. */}
          <div className="absolute inset-0 bg-gradient-to-t from-base via-base/85 to-base/40" />
        </div>

        {/* Alto generoso pero no 100dvh: en móvil una portada de pantalla
            completa esconde que abajo hay tienda. */}
        <div className="shell flex min-h-[26rem] flex-col justify-end py-14 sm:min-h-[30rem] sm:py-20 lg:min-h-[34rem]">
          <p className="text-xs uppercase tracking-widest text-muted">
            Skate shop · Santiago de Chile
          </p>

          <h1 className="mt-4 text-5xl leading-[0.9] sm:text-7xl lg:text-8xl">
            Scronter
          </h1>

          <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
            Tablas de maple que aguantan el cemento de verdad y ropa pensada
            para andar, no para la foto. Stock real, envíos a todo Chile.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/tienda"
              className={`${ctaBase} bg-accent text-accent-ink hover:bg-accent-hover`}
            >
              Ver tienda
            </Link>
            <Link
              href="/tienda?categoria=tablas"
              className={`${ctaBase} border border-line text-ink hover:border-accent hover:text-accent`}
            >
              Ver tablas
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================
          2 · CATEGORÍAS
          Se recorre CATEGORIAS (y no las claves de CATEGORIA_LABEL) porque ese
          array define el ORDEN de la vitrina; el objeto no garantiza ninguno.
          ==================================================================== */}
      <section className="shell py-14 sm:py-20">
        <h2 className="text-2xl sm:text-3xl">Categorías</h2>
        <p className="mt-2 text-sm text-muted">
          Todo lo que hay, ordenado como lo buscás.
        </p>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {CATEGORIAS.map((categoria) => (
            <li key={categoria}>
              <Link
                href={`/tienda?categoria=${categoria}`}
                className="group block overflow-hidden rounded border border-line bg-surface transition-colors hover:border-accent"
              >
                <div className="relative">
                  {/* Foto de categoría, de IMAGEN_CATEGORIA (arriba). El rótulo
                      va abajo sobre el scrim, así no se pisa con el texto que
                      dibuja el bloque cuando todavía no hay imagen. */}
                  <Placeholder
                    label={CATEGORIA_LABEL[categoria]}
                    src={IMAGEN_CATEGORIA[categoria]}
                    ratio="square"
                  />

                  {/* Scrim solo en la mitad inferior: el rótulo se lee siempre,
                      pero la imagen no queda apagada del todo. */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-base via-base/70 to-transparent p-3 pt-10">
                    <span className="block font-display text-sm uppercase tracking-wide text-ink transition-colors group-hover:text-accent sm:text-base">
                      {CATEGORIA_LABEL[categoria]}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ====================================================================
          3 · DESTACADOS
          El corte lo decide el flag `destacado` de cada producto en
          data/products.ts, no esta página: así se cambia la vitrina sin tocar
          código de UI.
          ==================================================================== */}
      <section className="shell border-t border-line py-14 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl">Destacados</h2>
            <p className="mt-2 text-sm text-muted">
              Lo que más sale y lo que queda en poca cantidad.
            </p>
          </div>

          <Link
            href="/tienda"
            className="border-b border-accent/40 pb-1 text-xs uppercase tracking-widest text-accent transition-colors hover:border-accent"
          >
            Ver todo
          </Link>
        </div>

        <div className="mt-8">
          <ProductGrid productos={destacados} />
        </div>
      </section>
    </>
  )
}
