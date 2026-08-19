import type { Metadata } from 'next'
import type { JSX, ReactNode } from 'react'
import './globals.css'
import { fontVariables } from '@/lib/fonts'
import { getSiteUrl } from '@/lib/site-url'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

/* ============================================================================
   LAYOUT RAÍZ
   ============================================================================
   Es Server Component (no lleva 'use client'), y así tiene que quedarse: es el
   ancestro de todo el sitio. El estado del carrito no vive en un Provider acá
   sino en el store de Zustand, justamente para no arrastrar el árbol entero al
   cliente — ver el comentario largo en `src/store/cart.ts`.
   ============================================================================ */

/** La misma URL pública que usa Flow para los webhooks. Sin ella, las rutas
 *  relativas de Open Graph no se pueden absolutizar y las previsualizaciones de
 *  WhatsApp / Instagram salen sin imagen.
 *  En Vercel se resuelve sola desde las variables que la plataforma inyecta;
 *  ver la precedencia en `src/lib/site-url.ts`. */
const SITE_URL = getSiteUrl()

const DESCRIPCION =
  'Tablas, gorros, polerones, poleras y zapatillas de skate. Despacho a todo Chile y pago con Flow.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    /* `default` es el título del home; `template` lo heredan las páginas que
       exportan solo su propio título — /tienda exporta "Tienda" y el navegador
       muestra "Tienda · Scronter". */
    default: 'Scronter — Skate shop',
    template: '%s · Scronter',
  },
  description: DESCRIPCION,
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    siteName: 'Scronter',
    title: 'Scronter — Skate shop',
    description: DESCRIPCION,
    url: '/',
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: 'Scronter — Skateboards & Streetwear',
      },
    ],
  },
  /* Deja el commit desplegado visible en el HTML, como
     <meta name="scronter-build" content="f690c1c">

     Para qué: sin esto no hay forma de saber desde afuera qué versión está
     realmente en producción. Los cambios de código no siempre se ven en la
     página — un arreglo interno o una foto que sigue en null renderizan igual —
     así que "¿ya se desplegó?" se vuelve una pregunta que solo el panel de
     Vercel puede responder. Con esta línea se responde con un solo fetch.

     VERCEL_GIT_COMMIT_SHA la inyecta Vercel en cada build. En local no existe,
     así que dice 'local'. */
  other: {
    'scronter-build': process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
  },
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}): JSX.Element {
  return (
    /* `fontVariables` declara --font-display y --font-body acá arriba, una sola
       vez, y `tailwind.config.ts` las mapea a font-display / font-body.
       lang="es" no es decorativo: define cómo silabea el navegador y qué voz usa
       un lector de pantalla. */
    <html lang="es" className={fontVariables}>
      {/* El fondo y la tipografía base los pone `globals.css` sobre el <body>.
          Acá solo se agrega el layout: columna a pantalla completa para que el
          footer quede abajo aunque la página tenga dos líneas de contenido. */}
      <body className="flex min-h-screen flex-col">
        {/* Salto al contenido: invisible hasta que se lo enfoca con Tab. Es la
            primera parada del teclado, para no obligar a recorrer todo el nav
            en cada página. */}
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-accent focus:px-4 focus:py-2 focus:text-xs focus:uppercase focus:tracking-widest focus:text-accent-ink"
        >
          Saltar al contenido
        </a>

        <Header />

        {/* `flex-1` empuja el footer al fondo en páginas cortas (confirmación de
            pago, carrito vacío); el min-h es el piso mínimo del área útil. */}
        <main id="contenido" className="min-h-[60vh] flex-1">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  )
}
