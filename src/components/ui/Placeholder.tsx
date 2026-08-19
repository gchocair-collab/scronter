import Image from 'next/image'
import type { JSX } from 'react'
import { cn } from '@/lib/format'

/* ============================================================================
   PLACEHOLDER — muestra la foto del producto, o un bloque si todavía no hay.

   Un solo componente cubre los dos estados a propósito. Así se pueden ir
   agregando las fotos de a una sin tocar ninguna página: la que tiene `src`
   muestra la imagen, la que no, muestra el bloque con el nombre. El sitio nunca
   queda con íconos de imagen rota ni con la grilla descuadrada.

   Por qué el bloque y no un <img> apuntando a un archivo que falta: el build
   pasa igual (lo verifiqué), pero en runtime el optimizador de Next responde
   HTTP 400 y el navegador dibuja el ícono de imagen rota en cada card — la
   tienda se ve caída sin que nada falle de forma visible en los logs. El bloque
   es un estado deliberado, no un error silencioso.

   Para agregar fotos, ver IMAGENES.md en la raíz del proyecto.
   ============================================================================ */

/**
 * Los ratios se declaran en un mapa y no armando la clase con template string
 * porque Tailwind escanea el código como TEXTO: una clase construida en runtime
 * no aparece en el CSS final y el bloque quedaría sin alto.
 */
const RATIO: Record<'square' | 'portrait' | 'wide', string> = {
  square: 'aspect-square', // grilla del catálogo
  portrait: 'aspect-[3/4]', // detalle de producto: ropa y tablas se ven mejor verticales
  wide: 'aspect-[16/9]', // banners y hero
}

export function Placeholder(props: {
  /** Nombre del producto. Se dibuja en el bloque, y es el `alt` de la imagen. */
  label: string
  /**
   * Ruta de la foto bajo /public — ej. '/images/tabla-og.jpg'.
   * `null` o ausente = todavía no hay foto, se dibuja el bloque.
   */
  src?: string | null
  ratio?: 'square' | 'portrait' | 'wide'
  className?: string
  /**
   * Ponelo en true SOLO para la imagen más grande visible al cargar la página
   * (el hero). Le dice a Next que la cargue con prioridad. Usarlo en todas las
   * cards tiene el efecto contrario: compiten entre sí y todo carga más lento.
   */
  priority?: boolean
  /**
   * Le dice a Next qué ancho real va a ocupar la imagen en pantalla, para que
   * pida al servidor una versión de esa resolución y no una más chica. Default
   * pensado para la grilla de catálogo (2/3/4 columnas). El hero, que ocupa
   * todo el ancho de la pantalla, tiene que pasar `sizes="100vw"` explícito —
   * si no, Next le sirve una versión pensada para un card de grilla y el
   * navegador la estira, y ahí se ve borrosa.
   */
  sizes?: string
}): JSX.Element {
  const {
    label,
    src,
    ratio = 'square',
    className,
    priority = false,
    sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  } = props

  const contenedor = cn(
    'relative flex items-center justify-center overflow-hidden',
    'border border-line bg-raised',
    'rounded',
    RATIO[ratio],
    className,
  )

  /* ------------------------------------------------------------------ FOTO -- */
  if (src) {
    return (
      <div className={contenedor}>
        <Image
          src={src}
          alt={label}
          fill
          // `fill` hace que la imagen ocupe el contenedor; object-cover recorta
          // en vez de deformar, que es lo correcto para fotos de producto de
          // proporciones distintas.
          className="object-cover"
          // `sizes`: evita que Next sirva una versión más chica de la que
          // realmente se muestra (ver el prop arriba).
          sizes={sizes}
          priority={priority}
        />
      </div>
    )
  }

  /* ---------------------------------------------------------------- BLOQUE -- */
  return (
    // role="img" + aria-label: para un lector de pantalla esto ocupa el lugar de
    // la foto, así que se anuncia como imagen con su descripción en vez de leer
    // el texto decorativo de adentro.
    <div role="img" aria-label={label} className={contenedor}>
      {/* Diagonal tenue: le da textura para que se lea como "acá va una foto" y
          no como un error de carga. Opacidad baja y color por token. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 border-b border-line/60"
        style={{
          // Único caso con `style`: el patrón repetido no tiene clase de
          // Tailwind. El color sale del token igual, no está hardcodeado.
          backgroundImage:
            'repeating-linear-gradient(45deg, rgb(var(--line) / 0.35) 0 1px, transparent 1px 10px)',
        }}
      />
      {/* `truncate` necesita un ancho acotado, de ahí el max-w-full: un nombre
          largo se corta con puntos suspensivos en vez de desbordar la card. */}
      <span className="relative max-w-full select-none truncate px-3 text-center font-display text-xs uppercase tracking-widest text-muted">
        {label}
      </span>
    </div>
  )
}
