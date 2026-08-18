import type { JSX, ReactNode } from 'react'
import { cn } from '@/lib/format'

/* ============================================================================
   BADGE — etiqueta chica de estado: "Agotado", "Últimas unidades", "Pagada".

   Los tonos semánticos (ok / warn / danger) están separados del acento a
   propósito, igual que en tokens.css: si mañana el acento de la marca pasa a
   rojo, un pago aprobado no puede empezar a verse como un error.
   ============================================================================ */

/**
 * Fondo al 15% del tono y texto al 100%: sobre el negro de la marca, un fondo
 * lleno de `ok` o `danger` grita más que el CTA. El borde tenue le da el filo
 * de 1px que usa el resto del sitio.
 */
const TONE: Record<'neutral' | 'ok' | 'warn' | 'danger' | 'accent', string> = {
  neutral: 'bg-raised text-muted border-line',
  ok: 'bg-ok/15 text-ok border-ok/30',
  warn: 'bg-warn/15 text-warn border-warn/30',
  danger: 'bg-danger/15 text-danger border-danger/30',
  accent: 'bg-accent/15 text-accent border-accent/30',
}

export function Badge(props: {
  children: ReactNode
  tone?: 'neutral' | 'ok' | 'warn' | 'danger' | 'accent'
  className?: string
}): JSX.Element {
  const { children, tone = 'neutral', className } = props

  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap border px-2 py-0.5',
        // rounded-sm y no una pastilla redonda: el radio sale del token
        // --radius-sm, que es chico porque la estética es angulosa. Si algún
        // día se quiere más suave, se cambia el token, no este archivo.
        'rounded-sm',
        'text-xs uppercase leading-none tracking-wide',
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
