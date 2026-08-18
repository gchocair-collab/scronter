import type { ButtonHTMLAttributes, JSX, ReactNode } from 'react'
import { cn } from '@/lib/format'

/* ============================================================================
   BUTTON — el único botón del sitio.

   No define ningún color propio: todo sale de los tokens (accent, line, danger).
   Cambiar `--accent` en tokens.css repinta todos los CTA de la tienda sin tocar
   este archivo.

   Es un server component a propósito: no tiene estado. El `onClick` lo pone
   quien lo usa, y ese llamador ya es 'use client' (VariantSelector, CartItem,
   CheckoutForm). Así el botón no arrastra JS al bundle cuando se usa en una
   página estática.
   ============================================================================ */

/**
 * Las variantes usan `enabled:hover:` y no `hover:` sola: sin eso, un botón
 * deshabilitado igual cambiaba de color al pasar el mouse y parecía clickeable.
 */
const VARIANT: Record<'primary' | 'ghost' | 'danger', string> = {
  // El acento es flúor: se usa lleno solo acá, en la acción principal.
  primary: 'bg-accent text-accent-ink enabled:hover:bg-accent-hover',
  // Acción secundaria: solo borde. El acento aparece recién en el hover.
  ghost:
    'border border-line bg-transparent text-ink enabled:hover:border-accent/40 enabled:hover:bg-raised',
  // Destructiva (quitar del carrito, vaciar). Nunca lleva fondo lleno: un
  // bloque rojo compite con el CTA y asusta más de lo que corresponde.
  danger:
    'border border-danger/40 bg-transparent text-danger enabled:hover:bg-danger/10',
}

/** Alturas fijas para que dos botones lado a lado nunca queden desalineados. */
const SIZE: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-sm sm:text-base',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: {
  children: ReactNode
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
} & ButtonHTMLAttributes<HTMLButtonElement>): JSX.Element {
  return (
    // No se fuerza `type`: se deja el default del navegador ('submit') para que
    // un Button dentro de un <form> siga enviándolo. Si el botón NO debe
    // enviar, el llamador pasa type="button".
    <button
      className={cn(
        // Base: mayúsculas y tracking amplio, la estética del resto del sitio.
        'inline-flex select-none items-center justify-center gap-2 rounded',
        'font-display text-center uppercase tracking-widest',
        // La transición es solo de color: animar todo hace que el foco y el
        // layout se sientan lentos.
        'transition-colors',
        // Deshabilitado: se ve apagado y el cursor lo confirma. No se usa
        // pointer-events-none porque eso también apagaría el cursor.
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT[variant],
        SIZE[size],
        // className va último: así el llamador puede sobrescribir (ej. w-full).
        className,
      )}
      // El spread va después de className para no perder aria-*, disabled ni
      // onClick, pero className ya se sacó de `rest` en el destructuring, así
      // que no hay riesgo de que lo pise.
      {...rest}
    >
      {children}
    </button>
  )
}
