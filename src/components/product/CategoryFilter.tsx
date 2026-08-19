'use client'

import Link from 'next/link'
import type { JSX } from 'react'

import { cn } from '@/lib/format'
import { CATEGORIA_LABEL, CATEGORIAS_ACTIVAS, type Category } from '@/types'

/** Cada opción del filtro: la de "todas" apunta a /tienda sin query. */
const OPCIONES: Array<{ valor: Category | 'todas'; label: string; href: string }> = [
  { valor: 'todas', label: 'Todas', href: '/tienda' },
  ...CATEGORIAS_ACTIVAS.map((c) => ({
    valor: c,
    label: CATEGORIA_LABEL[c],
    href: `/tienda?categoria=${c}`,
  })),
]

/**
 * Filtro de categorías. Navega con <Link> en vez de manejar estado local:
 * así la categoría vive en la URL y el filtro sobrevive a un refresh, se puede
 * compartir y funciona con el botón "atrás" del navegador.
 *
 * `activa` la calcula el Server Component desde searchParams; este componente
 * no la deduce por su cuenta para que servidor y cliente no puedan discrepar.
 */
export function CategoryFilter({ activa }: { activa: Category | 'todas' }): JSX.Element {
  return (
    <nav aria-label="Filtrar por categoría" className="border-b border-line">
      {/* En móvil la fila se desliza en horizontal: cinco categorías más "Todas"
          no caben en 360px y partirlas en dos líneas descoloca el subrayado. */}
      <ul className="-mb-px flex gap-5 overflow-x-auto sm:gap-7">
        {OPCIONES.map((opcion) => {
          const esActiva = opcion.valor === activa

          return (
            <li key={opcion.valor} className="shrink-0">
              <Link
                href={opcion.href}
                /* aria-current es lo que le dice a un lector de pantalla cuál
                   está seleccionada — el borde de color solo lo ve quien ve. */
                aria-current={esActiva ? 'page' : undefined}
                className={cn(
                  'block whitespace-nowrap border-b-2 pb-3 pt-1 text-xs uppercase tracking-widest transition-colors',
                  esActiva
                    ? 'border-accent text-ink'
                    : 'border-transparent text-muted hover:border-line hover:text-ink',
                )}
              >
                {opcion.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
