'use client'

import type { JSX } from 'react'
import type { Variant } from '@/types'
import { cn } from '@/lib/format'

/* ============================================================================
   SCRONTER — SELECTOR DE VARIANTE (medida o talla)
   ============================================================================

   Las variantes sin stock se muestran deshabilitadas y tachadas, nunca
   escondidas: si alguien busca la 44 y no la ve en la lista no sabe si no
   existe o si se agotó, y se va del sitio. Tachada comunica "existe, volvé".

   Es un grupo de botones con role="radiogroup" en vez de un <select>: con 6
   tallas el desplegable esconde justo la información que decide la compra (qué
   hay y qué no), y en móvil abre el selector nativo del sistema.
   ============================================================================ */

export function VariantSelector({
  variantes,
  tipo,
  seleccionada,
  onSelect,
}: {
  variantes: Variant[]
  tipo: 'medida' | 'talla'
  seleccionada: string | null
  onSelect: (variantId: string) => void
}): JSX.Element {
  const label = tipo === 'medida' ? 'Medida' : 'Talla'

  return (
    <div>
      <p id={`variant-label-${tipo}`} className="mb-2 text-xs uppercase tracking-widest text-muted">
        {label}
      </p>

      <div role="radiogroup" aria-labelledby={`variant-label-${tipo}`} className="flex flex-wrap gap-2">
        {variantes.map((v) => {
          const agotada = v.stock === 0
          const activa = v.id === seleccionada

          return (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={activa}
              // El aria-label completo evita que el lector de pantalla anuncie
              // solo "M" sin decir que está agotada.
              aria-label={agotada ? `${label} ${v.label}, agotada` : `${label} ${v.label}`}
              disabled={agotada}
              onClick={() => onSelect(v.id)}
              className={cn(
                'min-w-12 border px-3 py-2 text-sm uppercase tracking-wide transition-colors',
                activa
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-line bg-surface text-ink hover:border-accent hover:text-accent',
                agotada &&
                  'cursor-not-allowed border-line bg-transparent text-muted line-through opacity-50 hover:border-line hover:text-muted',
              )}
            >
              {v.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
