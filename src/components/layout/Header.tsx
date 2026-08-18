import Link from 'next/link'
import type { JSX } from 'react'
import { CartBadge } from '@/components/layout/CartBadge'

/* ============================================================================
   HEADER
   ============================================================================

   Server Component a propósito: no tiene estado propio. La única parte que
   necesita el navegador es <CartBadge />, que está aislado en su propio archivo
   marcado 'use client'.

   Por eso el menú móvil usa <details>/<summary> nativo y no useState:

   1. Un `useState` acá obligaría a marcar TODO el Header como 'use client', y
      con él el logo, el nav y el markup entero viajarían al bundle.
   2. <details> abre y cierra sin una línea de JavaScript. Si el bundle todavía
      no cargó — o falló — el menú igual funciona. En móvil con red mala eso es
      la diferencia entre poder navegar y no poder.
   3. El navegador ya le pone la semántica de accesibilidad: el <summary> es
      focuseable, responde a Enter y Espacio, y expone aria-expanded solo.
      Reimplementar eso a mano es donde se rompen los menús hechos a mano.
   ============================================================================ */

/** Un solo lugar para los links: los usan la versión de escritorio y la móvil. */
const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/tienda', label: 'Tienda' },
] as const

export function Header(): JSX.Element {
  return (
    /* `sticky` ya posiciona el elemento, así que el panel del menú móvil puede
       ir `absolute` respecto del header sin agregarle `relative` (que anularía
       el sticky). */
    <header className="sticky top-0 z-50 border-b border-line bg-surface">
      <div className="shell flex h-14 items-center justify-between gap-4 sm:h-16">
        {/* MARCA
            TODO: reemplazar por el logo real (SVG en /public/logo.svg) cuando
            exista. Mientras tanto es el wordmark en la display condensada. */}
        <Link
          href="/"
          className="font-display text-2xl uppercase leading-none tracking-tight text-ink transition-colors hover:text-accent sm:text-3xl"
        >
          Scronter
        </Link>

        {/* NAV DE ESCRITORIO — oculto en móvil, donde manda el <details>. */}
        <nav aria-label="Navegación principal" className="hidden sm:block">
          <ul className="flex items-center gap-8">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  /* El subrayado en acento aparece en hover. No se marca la
                     ruta activa acá porque saber la ruta requiere usePathname()
                     y eso volvería el Header un Client Component. */
                  className="border-b-2 border-transparent pb-1 text-xs uppercase tracking-widest text-muted transition-colors hover:border-accent hover:text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <CartBadge />

          {/* MENÚ MÓVIL — nativo, sin JS ni estado. */}
          <details className="group sm:hidden">
            <summary
              /* `list-none` + el pseudo-elemento de WebKit: saca el triangulito
                 que el navegador dibuja por defecto en el <summary>. */
              className="flex cursor-pointer list-none items-center rounded-sm border border-line p-2 text-ink transition-colors hover:border-accent hover:text-accent [&::-webkit-details-marker]:hidden"
              aria-label="Abrir menú"
            >
              {/* Hamburguesa cerrado / cruz abierto. El intercambio es CSS puro
                  vía la variante `group-open`, que lee el atributo `open` del
                  <details> padre. */}
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5 group-open:hidden"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="square"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="hidden h-5 w-5 group-open:block"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="square"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </summary>

            {/* El panel cae por debajo del header (`top-full`) y cruza todo el
                ancho de la pantalla. */}
            <nav
              aria-label="Navegación móvil"
              className="absolute left-0 right-0 top-full border-b border-line bg-surface"
            >
              <ul className="shell flex flex-col py-2">
                {NAV.map((item) => (
                  <li key={item.href} className="border-b border-line last:border-b-0">
                    <Link
                      href={item.href}
                      className="block py-3 text-sm uppercase tracking-widest text-ink transition-colors hover:text-accent"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </details>
        </div>
      </div>
    </header>
  )
}
