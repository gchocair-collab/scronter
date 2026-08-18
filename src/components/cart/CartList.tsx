'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart, useCartLines, useCartHydrated } from '@/store/cart'
import { Button } from '@/components/ui/Button'
import { CartItem } from '@/components/cart/CartItem'

/* ============================================================================
   Lista del carrito. Tres estados que NO se pueden confundir entre sí:

     1. sin hidratar → skeleton. El store todavía no leyó localStorage, así que
        `lines` está vacío por razones técnicas, no porque el carrito lo esté.
        Mostrar "tu carrito está vacío" acá sería mentirle al comprador que
        acaba de agregar tres productos y refrescó la página.
     2. hidratado y vacío → mensaje + salida a la tienda.
     3. con líneas → la lista y el botón de vaciar.
   ============================================================================ */

export function CartList() {
  const hidratado = useCartHydrated()
  const lineas = useCartLines()
  const clear = useCart((s) => s.clear)

  // Vaciar el carrito es destructivo y no tiene undo, así que se pide
  // confirmación en el lugar. Se evita `window.confirm`: es un modal del
  // navegador imposible de estilar y que en móvil se ve ajeno al sitio.
  const [confirmandoVaciar, setConfirmandoVaciar] = useState(false)

  /* ------------------------------------------------------------ 1. skeleton -- */
  if (!hidratado) {
    return (
      <div>
        <span className="sr-only" role="status">
          Cargando carrito…
        </span>
        <ul aria-hidden className="animate-pulse">
          {[0, 1].map((i) => (
            <li key={i} className="flex gap-3 border-b border-line py-4 sm:gap-4 sm:py-5">
              <div className="aspect-square w-20 shrink-0 rounded-sm bg-raised sm:w-24" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-20 rounded-sm bg-raised" />
                <div className="h-4 w-2/3 rounded-sm bg-raised" />
                <div className="h-3 w-24 rounded-sm bg-raised" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  /* --------------------------------------------------------------- 2. vacío -- */
  if (lineas.length === 0) {
    return (
      <div className="border border-line bg-surface px-6 py-14 text-center rounded">
        <p className="text-xs uppercase tracking-widest text-muted">Carrito</p>
        <h2 className="mt-3 text-2xl sm:text-3xl">Todavía no hay nada acá</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          Cuando agregues productos van a aparecer en esta lista. Los precios se toman del catálogo
          en el momento de pagar.
        </p>
        <Link
          href="/tienda"
          className="mt-7 inline-flex items-center justify-center rounded bg-accent px-5 py-3 font-display text-sm uppercase tracking-widest text-accent-ink transition-colors hover:bg-accent-hover"
        >
          Ver la tienda
        </Link>
      </div>
    )
  }

  /* ---------------------------------------------------------- 3. con líneas -- */
  const unidades = lineas.reduce((acc, l) => acc + l.cantidad, 0)

  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-line pb-3">
        <p className="text-xs uppercase tracking-widest text-muted">
          {lineas.length} {lineas.length === 1 ? 'producto' : 'productos'}
        </p>
        <p className="text-xs uppercase tracking-widest text-muted tnum">
          {unidades} {unidades === 1 ? 'unidad' : 'unidades'}
        </p>
      </div>

      <ul>
        {/* La clave combina producto y variante: la misma polera en M y en L son
            dos líneas distintas y con el productId solo se pisarían. */}
        {lineas.map((linea) => (
          <CartItem key={`${linea.productId}-${linea.variantId}`} linea={linea} />
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {confirmandoVaciar ? (
          <>
            <p className="text-sm text-muted">¿Sacar todos los productos?</p>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                clear()
                setConfirmandoVaciar(false)
              }}
            >
              Sí, vaciar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmandoVaciar(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setConfirmandoVaciar(true)}>
            Vaciar carrito
          </Button>
        )}

        <Link
          href="/tienda"
          className="ml-auto text-xs uppercase tracking-widest text-muted hover:text-accent"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  )
}
