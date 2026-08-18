'use client'

import Link from 'next/link'
import type { JSX } from 'react'
import { useCartCount, useCartHydrated } from '@/store/cart'
import { cn } from '@/lib/format'

/* ============================================================================
   BADGE DEL CARRITO
   ============================================================================

   Es el único pedazo del Header que necesita ser cliente: lee el store.
   Por eso vive en su propio archivo — así el Header sigue siendo Server
   Component y no arrastra Zustand al bundle de todas las páginas.
   ============================================================================ */

export function CartBadge(): JSX.Element {
  const hidratado = useCartHydrated()
  const cantidad = useCartCount()

  /* Por qué se espera la hidratación antes de mostrar el número:

     El HTML lo genera el servidor, donde no existe localStorage, así que ahí el
     carrito siempre está vacío. En el primer render del cliente el store
     tampoco leyó el storage todavía. Si pintáramos el contador en ese momento
     mostraría "0" y un instante después saltaría a "3" — un parpadeo visible en
     CADA carga de página, en el elemento más mirado del header.

     Peor: React compara el HTML del servidor con el primer render del cliente.
     Si difieren, tira un error de hidratación y descarta el árbol.

     La solución es no renderizar el contador hasta que `useCartHydrated()` sea
     true. El primer render del cliente queda idéntico al del servidor (sin
     número), y el contador aparece una sola vez, ya con el valor correcto. */
  const mostrarContador = hidratado && cantidad > 0

  return (
    <Link
      href="/carrito"
      /* `relative` porque el contador va posicionado encima del ícono: así
         aparecer no empuja al resto del header (cero layout shift). */
      className="relative flex items-center gap-2 rounded-sm border border-line px-3 py-2 text-xs uppercase tracking-widest text-ink transition-colors hover:border-accent hover:text-accent"
      aria-label={
        mostrarContador
          ? `Carrito, ${cantidad} ${cantidad === 1 ? 'producto' : 'productos'}`
          : 'Carrito'
      }
    >
      {/* Ícono de bolsa dibujado en SVG y no como imagen: hereda el color con
          `currentColor`, así el hover en acento funciona sin un segundo asset. */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="square"
      >
        <path d="M4 7h16l-1.2 13H5.2L4 7Z" />
        <path d="M8.5 7V5.5a3.5 3.5 0 0 1 7 0V7" />
      </svg>

      <span className="hidden sm:inline">Carrito</span>

      {mostrarContador && (
        <span
          className={cn(
            'absolute -right-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center',
            'rounded-sm bg-accent px-1 text-[11px] font-bold leading-none text-accent-ink tnum',
          )}
        >
          {/* Más de 99 unidades rompería el ancho del badge. */}
          {cantidad > 99 ? '99+' : cantidad}
        </span>
      )}
    </Link>
  )
}
