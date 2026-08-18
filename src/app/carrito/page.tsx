import type { Metadata } from 'next'
import { CartList } from '@/components/cart/CartList'
import { CartSummary } from '@/components/cart/CartSummary'

/* ============================================================================
   /carrito

   Server Component a propósito: el estado del carrito vive en el cliente
   (Zustand + localStorage), así que esta página solo arma la estructura y deja
   que los dos componentes cliente hidraten lo suyo. Nada de 'use client' acá
   arriba — así el layout y el marcado se sirven ya renderizados.
   ============================================================================ */

export const metadata: Metadata = {
  title: 'Carrito · Scronter',
  description: 'Revisá los productos que agregaste antes de pagar.',
}

export default function CarritoPage() {
  // El contenedor raíz es un <div>, no un <main>: el landmark <main> lo pone el
  // layout. Dos <main> anidados es HTML inválido y confunde a los lectores de
  // pantalla, que esperan encontrar uno solo por documento.
  return (
    <div className="shell py-8 sm:py-12">
      <header className="mb-6 sm:mb-10">
        <p className="text-xs uppercase tracking-widest text-muted">Paso 1 de 2</p>
        <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl">Tu carrito</h1>
      </header>

      {/* En móvil el resumen queda abajo de la lista; desde lg va a la derecha y
          se pega al scroll, para que el total siga visible con muchas líneas. */}
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:gap-10 xl:grid-cols-[1fr_22rem]">
        <div className="min-w-0">
          <CartList />
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <CartSummary ctaHref="/checkout" ctaLabel="Ir a pagar" />
        </div>
      </div>
    </div>
  )
}
