import type { Metadata } from 'next'
import type { JSX } from 'react'
import Link from 'next/link'
import { CartSummary } from '@/components/cart/CartSummary'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'

/* ============================================================================
   SCRONTER — CHECKOUT
   ============================================================================

   La página es un Server Component y se queda así a propósito: no lee el
   carrito. Todo lo que depende del localStorage vive dentro de dos componentes
   cliente (`CheckoutForm` y `CartSummary`), así que el HTML se sirve estático y
   solo se hidrata lo que realmente necesita el navegador.

   El resumen no repite las líneas del carrito ítem por ítem: para revisar y
   editar cantidades está /carrito, que es el paso anterior. Acá se muestra el
   monto y un link para volver, que es lo que la gente busca en este punto.
   ============================================================================ */

export const metadata: Metadata = {
  title: 'Checkout',
  description:
    'Completá tus datos de despacho y pagá con Flow. Los datos de tu tarjeta no pasan por Scronter.',
}

export default function CheckoutPage(): JSX.Element {
  return (
    // Sin <main>: el landmark lo pone el layout, y dos <main> en la misma página
    // rompen la navegación por regiones de los lectores de pantalla.
    <div className="shell py-10 sm:py-14">
      <p className="text-xs uppercase tracking-widest text-muted">Paso 2 de 3 · Datos y pago</p>
      <h1 className="mt-3 text-3xl sm:text-5xl">Finalizar compra</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
        Completá los datos de despacho y te llevamos a Flow para pagar. El monto final lo calcula
        nuestro servidor con los precios del catálogo, no el navegador.
      </p>

      {/* En móvil: resumen arriba (el monto es lo primero que se chequea) y
          formulario abajo. En lg se invierte con order-*, así el formulario
          queda en la columna ancha de la izquierda. */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-10">
        <div className="lg:order-1">
          <CheckoutForm />
        </div>

        <aside className="space-y-4 lg:order-2 lg:sticky lg:top-24">
          <h2 className="text-xs uppercase tracking-widest text-muted">Tu pedido</h2>

          <CartSummary />

          {/* ------------------------------------------------------------------
              Confianza. En Chile, "¿dónde pongo la tarjeta?" es la duda que más
              carritos abandona: conviene decir explícitamente que el cobro lo
              hace Flow y que este sitio no ve la tarjeta.
              ------------------------------------------------------------------ */}
          <div className="rounded-sm border border-line bg-surface p-4">
            <h3 className="text-sm">Pago seguro con Flow</h3>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
              <li>
                El pago se procesa en <span className="text-ink">Flow</span>, que es donde elegís el
                medio: tarjetas de crédito y débito, transferencia o billeteras.
              </li>
              <li>
                <span className="text-ink">Tu tarjeta nunca pasa por este sitio.</span> Scronter no
                ve, no recibe y no guarda los datos de la tarjeta en ningún momento.
              </li>
              <li>
                Cuando el pago se confirma volvés automáticamente a Scronter con el comprobante de
                la orden.
              </li>
            </ul>
          </div>

          {/* TODO: reemplazar por el cálculo real de despacho (Chilexpress /
              Starken) cuando exista la integración. Hoy el total es solo
              productos, así que hay que decirlo. */}
          <p className="text-xs leading-relaxed text-muted">
            El despacho todavía no está integrado: coordinamos el envío por mail después de
            confirmar el pago. Retiro en taller disponible en Santiago.
          </p>

          <Link
            href="/carrito"
            className="inline-flex items-center text-xs uppercase tracking-widest text-muted transition-colors hover:text-accent"
          >
            ← Volver al carrito
          </Link>
        </aside>
      </div>
    </div>
  )
}
