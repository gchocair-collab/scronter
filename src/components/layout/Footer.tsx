import Link from 'next/link'
import type { JSX } from 'react'
import { CATEGORIAS, CATEGORIA_LABEL } from '@/types'

/* ============================================================================
   FOOTER
   ============================================================================
   Server Component: es markup estático, no necesita nada del navegador.

   Todo lo que acá abajo dice TODO es un dato de relleno. Están puestos igual
   —y no dejados en blanco— porque una tienda sin datos de contacto ni redes se
   ve abandonada, y así se ve el layout real desde el primer día. Reemplazalos
   antes de publicar.
   ============================================================================ */

/* TODO: reemplazar por los perfiles reales de la marca.
   El href="#" es deliberado: un link roto a instagram.com/scronter sería peor
   que uno que no va a ningún lado. */
const REDES = [
  { label: 'Instagram', href: '#' },
  { label: 'TikTok', href: '#' },
  { label: 'YouTube', href: '#' },
] as const

/* TODO: reemplazar por los datos reales de contacto de Scronter. */
const CONTACTO = [
  { label: 'Correo', valor: 'hola@scronter.cl' },
  { label: 'WhatsApp', valor: '+56 9 0000 0000' },
  { label: 'Taller', valor: 'Santiago, Chile' },
] as const

export function Footer(): JSX.Element {
  /* Se calcula en el servidor. En una página estática queda congelado al momento
     del build, que para un año en el pie es perfectamente aceptable. */
  const anio = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="shell grid grid-cols-2 gap-8 py-12 sm:grid-cols-3 lg:grid-cols-4">
        {/* MARCA — ocupa las dos columnas en móvil para que el manifiesto respire. */}
        <div className="col-span-2 lg:col-span-1">
          {/* TODO: reemplazar por el logo real (SVG en /public/logo.svg). */}
          <p className="font-display text-2xl uppercase leading-none tracking-tight text-ink">
            Scronter
          </p>
          <p className="mt-3 max-w-xs text-sm text-muted">
            Tablas, ropa y fierros para andar. Hecho en Chile, probado en la
            calle.
          </p>
        </div>

        {/* CATEGORÍAS — se generan desde `CATEGORIAS` para que agregar una
            categoría al catálogo la haga aparecer acá sola. */}
        <nav aria-labelledby="footer-tienda">
          <h2 id="footer-tienda" className="text-xs uppercase tracking-widest text-muted">
            Tienda
          </h2>
          <ul className="mt-4 space-y-2">
            {CATEGORIAS.map((categoria) => (
              <li key={categoria}>
                <Link
                  href={`/tienda?categoria=${categoria}`}
                  className="text-sm text-ink transition-colors hover:text-accent"
                >
                  {CATEGORIA_LABEL[categoria]}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/tienda"
                className="text-sm text-muted transition-colors hover:text-accent"
              >
                Ver todo
              </Link>
            </li>
          </ul>
        </nav>

        {/* CONTACTO */}
        <div>
          <h2 className="text-xs uppercase tracking-widest text-muted">Contacto</h2>
          <ul className="mt-4 space-y-2">
            {CONTACTO.map((dato) => (
              <li key={dato.label} className="text-sm text-ink">
                <span className="text-muted">{dato.label}: </span>
                {dato.valor}
              </li>
            ))}
          </ul>
        </div>

        {/* REDES */}
        <nav aria-labelledby="footer-redes">
          <h2 id="footer-redes" className="text-xs uppercase tracking-widest text-muted">
            Seguinos
          </h2>
          <ul className="mt-4 space-y-2">
            {REDES.map((red) => (
              <li key={red.label}>
                <a
                  href={red.href}
                  className="text-sm uppercase tracking-widest text-ink transition-colors hover:text-accent"
                >
                  {red.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* BARRA INFERIOR */}
      <div className="border-t border-line">
        <div className="shell flex flex-col gap-2 py-6 text-xs uppercase tracking-widest text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="tnum">© {anio} Scronter</p>
          {/* TODO: enlazar los términos y la política de despacho reales cuando
              existan esas páginas. */}
          <p>Precios en pesos chilenos · IVA incluido</p>
        </div>
      </div>
    </footer>
  )
}
