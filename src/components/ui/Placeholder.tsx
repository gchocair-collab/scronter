import type { JSX } from 'react'
import { cn } from '@/lib/format'

/* ============================================================================
   PLACEHOLDER — el sustituto de las fotos que todavía no existen.

   ¿Por qué existe este componente en vez de un <Image> apuntando a un archivo?
   Porque `next/image` con un `src` local que no está en /public rompe el BUILD,
   no solo la vista: Next intenta leer el archivo en tiempo de compilación y
   falla. Y un <img> a un archivo inexistente deja el ícono de imagen rota en
   cada card, que hace ver la tienda entera como si estuviera caída.

   Así que mientras no haya fotos, todas las imágenes del sitio pasan por acá:
   un bloque sólido con el nombre del producto encima. La grilla conserva sus
   proporciones y el sitio se ve intencional, no incompleto.

   TODO: reemplazar por next/image cuando existan las fotos reales.
   El cambio es local a este archivo si se mantiene la misma firma:
       <Image src={producto.imagen} alt={producto.nombre} fill className="object-cover" />
   dentro del mismo contenedor con `aspect-*`, para que el ratio siga siendo
   responsabilidad de este componente y no de cada llamador.
   ============================================================================ */

/**
 * Los ratios se declaran en un mapa (y no armando la clase con template
 * string) porque Tailwind escanea el código como texto: una clase construida
 * en runtime no aparece en el CSS final y el bloque quedaría sin alto.
 */
const RATIO: Record<'square' | 'portrait' | 'wide', string> = {
  square: 'aspect-square', // grilla del catálogo
  portrait: 'aspect-[3/4]', // detalle de producto: ropa y tablas se ven mejor verticales
  wide: 'aspect-[16/9]', // banners y hero
}

export function Placeholder(props: {
  /** Texto que se dibuja encima. Normalmente el nombre del producto. */
  label: string
  ratio?: 'square' | 'portrait' | 'wide'
  className?: string
}): JSX.Element {
  const { label, ratio = 'square', className } = props

  return (
    // role="img" + aria-label: para un lector de pantalla esto ocupa el lugar
    // de la foto, así que se anuncia como una imagen con su descripción en vez
    // de leer el texto decorativo de adentro.
    <div
      role="img"
      aria-label={label}
      className={cn(
        'relative flex items-center justify-center overflow-hidden',
        'border border-line bg-raised',
        'rounded',
        RATIO[ratio],
        className,
      )}
    >
      {/* Diagonal tenue: le da textura al bloque para que se lea como
          "acá va una foto" y no como un error de carga. Opacidad baja y color
          por token — nunca un color literal. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 border-b border-line/60"
        style={{
          // Único caso con `style`: el patrón repetido no tiene clase de
          // Tailwind. El color sale igual del token, no está hardcodeado.
          backgroundImage:
            'repeating-linear-gradient(45deg, rgb(var(--line) / 0.35) 0 1px, transparent 1px 10px)',
        }}
      />
      {/* `truncate` necesita un ancho acotado, de ahí el max-w-full. Un nombre
          largo se corta con puntos suspensivos en vez de desbordar la card. */}
      <span className="relative max-w-full select-none truncate px-3 text-center font-display text-xs uppercase tracking-widest text-muted">
        {label}
      </span>
    </div>
  )
}
