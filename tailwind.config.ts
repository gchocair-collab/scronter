import type { Config } from 'tailwindcss'

/* ============================================================================
   Este archivo solo MAPEA los tokens a nombres de clase de Tailwind.

   Los valores reales de color viven en `src/styles/tokens.css`.
   Las fuentes reales viven en `src/lib/fonts.ts`.

   Normalmente no necesitás tocar este archivo. Solo si querés AGREGAR un token
   nuevo (por ejemplo un segundo acento) — en ese caso lo declarás en
   tokens.css y lo registrás acá.

   El truco del `rgb(var(--x) / <alpha-value>)`: guardar los colores como
   canales sueltos ("198 255 0" en vez de "#C6FF00") permite que Tailwind siga
   generando las variantes de opacidad, así `bg-accent/10` funciona igual que
   con un color hardcodeado. Con un hex plano en la variable, todas las clases
   con barra se romperían en silencio.
   ============================================================================ */

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'rgb(var(--base) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        raised: 'rgb(var(--raised) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover) / <alpha-value>)',
          ink: 'rgb(var(--accent-ink) / <alpha-value>)',
        },
        ok: 'rgb(var(--ok) / <alpha-value>)',
        warn: 'rgb(var(--warn) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      fontFamily: {
        // Los fallbacks importan: si la fuente no carga, el texto sigue
        // pareciéndose a lo que debía ser en vez de saltar a Times.
        display: ['var(--font-display)', 'Impact', 'Haettenschweiler', 'sans-serif'],
        body: ['var(--font-body)', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
      },
      maxWidth: {
        shell: '1280px',
      },
    },
  },
  plugins: [],
}

export default config
