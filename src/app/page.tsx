import type { Metadata } from 'next'
import Link from 'next/link'

import { ProductGrid } from '@/components/product/ProductGrid'
import { Placeholder } from '@/components/ui/Placeholder'
import { getFeaturedProducts } from '@/data/products'
import { CATEGORIA_LABEL, CATEGORIAS_ACTIVAS } from '@/types'

export const metadata: Metadata = {
  title: 'Scronter StreetLife & Skate shop',
  description:
    'SKATEBOARDS & STREETWEAR. Diseños y manufactura nacional. Creados para quienes viven la calle, el skate y la naturaleza como una sola inspiración.',
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
const HERO_IMAGEN: string | null = '/images/foto-scronter-hero.jpg'

/**
 * GIF animado de portada, en vez de la foto de arriba. Si está en `null`, el
 * hero muestra HERO_IMAGEN (foto fija). Si tiene una ruta, el GIF manda y la
 * foto queda de respaldo sin usarse.
 *
 * Es un <img> normal y no <Image> de next/image a propósito: el optimizador
 * de Next no anima GIFs (los sirve como frame fijo), así que acá se sirve el
 * archivo tal cual para que se reproduzca el loop.
 */
const HERO_GIF: string | null = '/images/horizontal-stgo-hero.gif'

/** Una foto por categoría, cuadrada. Las que queden en null muestran el bloque. */
const IMAGEN_CATEGORIA: Record<string, string | null> = {
  tablas: null,
  gorros: null,
  polerones: null,
  poleras: null,
  zapatillas: null,
}

/**
 * Oculta la sección de categorías del home por ahora (se va a usar más
 * adelante). No se borró nada: poné esto en `true` para que vuelva a
 * mostrarse, sin tocar el resto del archivo.
 */
const MOSTRAR_CATEGORIAS_HOME = false

export default function HomePage() {
  const destacados = getFeaturedProducts()

  return (
    <>
      {/* ====================================================================
          1 · HERO
          ==================================================================== */}
      <section className="relative isolate overflow-hidden border-b border-line">
        {/* Banner de portada. Sale de HERO_GIF si está seteado, si no de
            HERO_IMAGEN (ambos arriba de este archivo).
            Ojo al cambiarlo: mantené el degradado de abajo, que es lo que le da
            contraste al título sobre cualquier imagen. */}
        <div className="absolute inset-0 -z-10">
          {HERO_GIF ? (
            // eslint-disable-next-line @next/next/no-img-element -- animado, ver comentario en HERO_GIF
            <img src={HERO_GIF} alt="Banner Scronter" className="h-full w-full object-cover" />
          ) : (
            <Placeholder
              label="Banner Scronter "
              src={HERO_IMAGEN}
              ratio="wide"
              className="h-full w-full"
              // Ocupa todo el ancho de la pantalla, a diferencia de un card de
              // grilla — sin esto, Next le serviría una versión chica y se ve
              // borrosa al estirarla.
              sizes="100vw"
              // priority: es la imagen más grande y visible al cargar la home.
              priority
            />
          )}
          {/* Degradado desde el fondo de página hacia arriba: mantiene legible
              el texto sobre cualquier imagen que se ponga después, sin tener
              que retocar la foto. */}
          <div className="absolute inset-0 bg-gradient-to-t from-base via-base/85 to-base/40" />
        </div>

        {/* Alto generoso pero no 100dvh: en móvil una portada de pantalla
            completa esconde que abajo hay tienda. */}
        <div className="shell flex min-h-[26rem] flex-col justify-end py-14 sm:min-h-[30rem] sm:py-20 lg:min-h-[34rem]">
          <p className="text-xs uppercase tracking-widest text-muted">
            StreetLife - SKATEBOARDS - STREETWEAR
          </p>

          <h1 className="mt-4 text-5xl leading-[0.9] sm:text-7xl lg:text-8xl">
            Scronter Skate shop
          </h1>

          <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
            Diseños y produccion nacional. Creados para quienes viven la calle, el skate y la naturaleza como una sola inspiración.
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
          Detrás de MOSTRAR_CATEGORIAS_HOME (arriba de este archivo) — oculta
          por ahora, se reactiva más adelante poniendo esa constante en true.

          Se recorre CATEGORIAS_ACTIVAS (y no las claves de CATEGORIA_LABEL)
          porque ese array define el ORDEN de la vitrina Y cuáles se muestran;
          el objeto no garantiza ninguno de los dos.
          ==================================================================== */}
      {MOSTRAR_CATEGORIAS_HOME && (
        <section className="shell py-14 sm:py-20">
          <h2 className="text-2xl sm:text-3xl">Categorías</h2>
          <p className="mt-2 text-sm text-muted">
            Todo lo que hay disponible, ordenado como lo buscás.
          </p>

          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {CATEGORIAS_ACTIVAS.map((categoria) => (
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
      )}

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
