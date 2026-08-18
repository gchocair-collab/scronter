# Cómo editar el home de Scronter

Guía para modificar la página de inicio (`http://localhost:3000`) sin perderte en el resto
del proyecto. Todo el home vive en **un solo archivo**:

```
src/app/page.tsx
```

Tiene tres secciones, en este orden: **Hero** → **Categorías** → **Destacados**. Cada una se
edita en un lugar distinto, detallado abajo.

Antes de tocar nada, dejá corriendo `npm run dev` y abrí el navegador en
`http://localhost:3000`: cada vez que guardes, la página se actualiza sola.

---

## 1. El Hero (el banner grande de arriba)

Todo lo del hero está en la sección `1 · HERO` de `src/app/page.tsx`, líneas ~57-113.

### Cambiar el texto

Editá directamente el JSX:

```tsx
<h1 className="mt-4 text-5xl leading-[0.9] sm:text-7xl lg:text-8xl">
  Scronter
</h1>

<p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
  Tablas de maple que aguantan el cemento de verdad y ropa pensada
  para andar, no para la foto. Stock real, envíos a todo Chile.
</p>
```

También el textito chico de arriba (`Skate shop · Santiago de Chile`) y los dos botones
(`Ver tienda` / `Ver tablas`) — son `<Link href="...">`, cambiá el texto entre las etiquetas
y el `href` si querés que apunten a otro lado.

### Cambiar la foto de fondo

Cerca del inicio del archivo hay una constante:

```tsx
const HERO_IMAGEN: string | null = null
```

Mientras esté en `null`, se muestra un bloque gris con el rótulo "Banner Scronter" (así el
sitio nunca se ve roto). Para poner la foto real:

1. Copiá el archivo a `public/images/` (por ejemplo `public/images/banner-home.jpg`).
   Formato horizontal, mínimo **1920×1080**.
2. Cambiá la constante:

   ```tsx
   const HERO_IMAGEN: string | null = '/images/banner-home.jpg'
   ```

Guía completa de imágenes (nombres de archivo, tamaños por sección) en [IMAGENES.md](IMAGENES.md).

### Poner un video en vez de una foto

El comentario en el código lo marca explícitamente: es el único lugar a tocar. Reemplazá el
`<Placeholder>` de esa sección por:

```tsx
<video autoPlay muted loop playsInline poster="/images/banner-home.jpg" className="h-full w-full object-cover">
  <source src="/videos/banner-home.mp4" type="video/mp4" />
</video>
```

Mantené el `<div>` del degradado que va justo debajo — es lo que le da contraste al título
sobre cualquier fondo, sea foto o video.

---

## 2. Categorías

Sección `2 · CATEGORÍAS`, líneas ~115-155. Acá casi no hay nada que tocar en `page.tsx`
directamente: el contenido sale de otros dos archivos.

### Orden y nombres de las categorías

No se editan en el home. Están en `src/types/index.ts`:

```ts
export const CATEGORIA_LABEL: Record<Category, string> = {
  tablas: 'Tablas',
  gorros: 'Gorros',
  polerones: 'Polerones',
  poleras: 'Poleras',
  zapatillas: 'Zapatillas',
}

export const CATEGORIAS: Category[] = ['tablas', 'gorros', 'polerones', 'poleras', 'zapatillas']
```

- `CATEGORIA_LABEL` cambia el **texto visible** de cada categoría.
- `CATEGORIAS` cambia el **orden** en que aparecen (tanto en el home como en el filtro de
  `/tienda`).

Agregar o quitar una categoría entera es un cambio más grande (toca el tipo `Category` y el
catálogo de productos) — no es solo el home, así que si necesitás eso avisame y lo vemos aparte.

### Fotos de categoría

En `page.tsx`, junto a `HERO_IMAGEN`:

```tsx
const IMAGEN_CATEGORIA: Record<string, string | null> = {
  tablas: null,
  gorros: null,
  polerones: null,
  poleras: null,
  zapatillas: null,
}
```

Mismo mecanismo que el hero: copiás la foto a `public/images/` (cuadrada) y reemplazás el
`null` correspondiente por la ruta. Se puede hacer de a una — las que sigan en `null` muestran
el bloque con el nombre.

---

## 3. Destacados

Sección `3 · DESTACADOS`, líneas ~157-183. El texto del título (`Destacados`) y del subtítulo
se editan igual que el hero, directo en el JSX.

**Qué productos aparecen no se decide en el home.** Sale del flag `destacado` de cada producto
en `src/data/products.ts`:

```ts
{
  id: 'tbl-001',
  slug: 'tabla-concrete-jungle',
  nombre: 'Tabla Concrete Jungle',
  // ...
  destacado: true,   // 👈 esto lo hace aparecer en el home
},
```

Para cambiar la vitrina: abrí `src/data/products.ts`, buscá el producto y poné `destacado:
true` o `false`. No hay límite de cantidad ni orden especial — se muestran todos los que
tengan `true`, en el orden en que aparecen en el archivo.

---

## Colores y tipografía (afecta a todo el sitio, no solo al home)

Ninguna sección del home tiene colores propios — todas usan clases como `bg-accent`,
`text-ink`, `border-line`, que apuntan a variables centralizadas. Si querés cambiar el color
de marca (el verde flúor) en **todo el sitio de una sola vez**, el archivo es:

```
src/styles/tokens.css
```

Ahí mismo hay alternativas ya calculadas (amarillo, naranja, cyan, magenta) listas para pegar
en `--accent`. Para tipografía, el archivo es `src/lib/fonts.ts`.

---

## Resumen rápido

| Qué querés cambiar | Archivo |
| --- | --- |
| Título, subtítulo o botones del hero | `src/app/page.tsx` (sección Hero) |
| Foto o video de portada | `src/app/page.tsx` → constante `HERO_IMAGEN` |
| Nombre u orden de las categorías | `src/types/index.ts` |
| Foto de cada categoría | `src/app/page.tsx` → constante `IMAGEN_CATEGORIA` |
| Qué productos salen en Destacados | `src/data/products.ts` → campo `destacado` |
| Color de marca (afecta todo el sitio) | `src/styles/tokens.css` |
| Tipografía | `src/lib/fonts.ts` |
