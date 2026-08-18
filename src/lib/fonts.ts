/* ============================================================================
   SCRONTER — TIPOGRAFÍA
   ============================================================================

   👉 ESTE ES EL ÚNICO ARCHIVO QUE TOCÁS PARA CAMBIAR LAS FUENTES.

   Son dos roles, y los componentes solo conocen los roles — nunca el nombre
   de la fuente:

       font-display  → títulos, precios grandes, el logotipo
       font-body     → todo el resto (párrafos, labels, inputs)

   Para cambiar una fuente:
     1. Cambiás el import de `next/font/google` de abajo.
     2. Ajustás los `weight` que esa familia realmente tenga (si pedís un peso
        que no existe, Next falla en build — es un error útil, no silencioso).
     3. Listo. No hay que tocar `tailwind.config.ts` ni ningún componente.

   Por qué `next/font` y no un <link> a Google Fonts: descarga los archivos en
   build y los sirve desde tu propio dominio, así que no hay request a Google
   en runtime, no hay layout shift, y no se filtra la IP de tus visitantes.
   ============================================================================ */

import { Anton, Barlow } from 'next/font/google'

/* ---------------------------------------------------------------------------
   DISPLAY — títulos. Condensada y pesada.

   Anton es de un solo peso (400) pero visualmente lee como un black condensed.
   Alternativas condensadas que quedan bien en streetwear:
     Bebas Neue      → { weight: '400' }   más alta y angosta
     Oswald          → { weight: ['500','700'] }  más neutra, tiene pesos
     Archivo Black   → { weight: '400' }   ancha y muy pesada
     Teko            → { weight: ['500','700'] }  técnica, casi deportiva

   Nota: si cambiás a una familia con varios pesos, pasá `weight` como array.
   --------------------------------------------------------------------------- */
export const fontDisplay = Anton({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-display',
})

/* ---------------------------------------------------------------------------
   BODY — texto corrido, labels, inputs.

   Barlow es una grotesca ligeramente condensada con aire atlético: acompaña
   a Anton sin competirle y mantiene buena legibilidad en párrafo.
   Alternativas:
     DM Sans         → más geométrica y neutra
     Work Sans       → más humanista, algo más cálida
     IBM Plex Sans   → más técnica, buena para fichas de producto

   Evitá Inter acá: es la fuente por defecto de medio internet y le quita
   carácter a la marca.
   --------------------------------------------------------------------------- */
export const fontBody = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-body',
})

/**
 * Se aplica una sola vez, en `src/app/layout.tsx`, sobre el <html>.
 * Deja las dos familias disponibles como CSS custom properties, que es lo que
 * `tailwind.config.ts` mapea a `font-display` y `font-body`.
 */
export const fontVariables = `${fontDisplay.variable} ${fontBody.variable}`
