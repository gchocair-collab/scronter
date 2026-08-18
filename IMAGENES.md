# Cómo agregar las imágenes de Scronter

Guía para reemplazar los placeholders por fotos reales. No necesitás saber nada del código:
son dos pasos por foto, y se pueden hacer de a una.

---

## Resumen en 30 segundos

1. Copiás la foto a la carpeta `public/images/`
2. Abrís `src/data/products.ts`, buscás el producto, y cambiás `imagen: null` por
   `imagen: '/images/nombre-del-archivo.jpg'`
3. Guardás. Si tenés `npm run dev` corriendo, la foto aparece sola en el navegador.

Eso es todo. **No hace falta tener las 16 fotos**: las que sigan en `null` muestran un bloque
gris con el nombre del producto, y la tienda se ve prolija igual.

---

## Antes de empezar

Si es la primera vez en este computador:

```
git clone https://github.com/gchocair-collab/scronter.git
cd scronter
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

Si ya lo tenías clonado, traé los cambios antes de tocar nada:

```
git pull
npm install
npm run dev
```

Abrí <http://localhost:3000> y dejá el navegador abierto en una ventana aparte. Cada vez que
guardes un archivo, la página se actualiza sola.

---

## Paso a paso, con un ejemplo real

Digamos que tenés la foto de la **Tabla Concrete Jungle**.

### 1. Renombrá el archivo

Usá el `slug` del producto (está en la tabla de más abajo). Para esta tabla:

```
tabla-concrete-jungle.jpg
```

Reglas del nombre, y son importantes:

- Todo en **minúsculas**
- Palabras separadas con **guiones**, nunca espacios
- **Sin tildes ni ñ** — el nombre viaja en la URL, y una tilde obliga al navegador a
  codificarla (`flúor` se convierte en `fl%C3%BAor`), lo que ensucia los links y el SEO
- La extensión en minúscula: `.jpg`, no `.JPG`

### 2. Copiá el archivo

Va en la carpeta `public/images/` del proyecto:

```
scronter/
└── public/
    └── images/
        ├── placeholder.jpg          ← ya estaba, podés dejarla
        ├── placeholder-hero.jpg     ← ya estaba
        └── tabla-concrete-jungle.jpg  ← la tuya
```

### 3. Apuntá el producto a la foto

Abrí `src/data/products.ts` y buscá el producto. Vas a ver algo así:

```ts
{
  id: 'tbl-001',
  slug: 'tabla-concrete-jungle',
  nombre: 'Tabla Concrete Jungle',
  categoria: 'tablas',
  precio: 52990,
  descripcionCorta: 'Maple canadiense de 7 capas, cóncavo medio.',
  descripcion: '...',
  imagen: null,          // ← esta línea
  ...
}
```

Cambiá esa línea por:

```ts
  imagen: '/images/tabla-concrete-jungle.jpg',
```

**Ojo con la ruta:** empieza con `/images/`, **no** con `public/images/`. La carpeta `public`
es la raíz del sitio, así que desaparece de la URL. Es el error más común.

### 4. Guardá y mirá

La foto aparece en el catálogo, en la ficha del producto y en el carrito. No hay que tocar
ningún componente: los tres leen del mismo campo.

---

## Los 16 productos

El nombre de archivo sugerido es el `slug`, así no tenés que pensarlo. La columna **Formato**
importa: mirá la sección de tamaños más abajo.

### Tablas — foto vertical (3:4)

| Producto | Nombre de archivo sugerido |
| --- | --- |
| Tabla Concrete Jungle | `tabla-concrete-jungle.jpg` |
| Tabla Nightshift | `tabla-nightshift.jpg` |
| Tabla First Push | `tabla-first-push.jpg` |
| Tabla Grip Tape OG | `tabla-grip-tape-og.jpg` |

### Gorros — foto cuadrada

| Producto | Nombre de archivo sugerido |
| --- | --- |
| Beanie Scronter | `gorro-beanie-scronter.jpg` |
| 5-Panel Flat | `gorro-5-panel-flat.jpg` |
| Bucket Washed | `gorro-bucket-washed.jpg` |

### Polerones — foto cuadrada

| Producto | Nombre de archivo sugerido |
| --- | --- |
| Polerón Heavyweight Negro | `poleron-heavyweight-negro.jpg` |
| Polerón Zip Concrete | `poleron-zip-concrete.jpg` |
| Polerón Crewneck Flúor | `poleron-crewneck-fluor.jpg` |

### Poleras — foto cuadrada

| Producto | Nombre de archivo sugerido |
| --- | --- |
| Polera Logo Clásica | `polera-logo-clasica.jpg` |
| Polera Oversize Street | `polera-oversize-street.jpg` |
| Polera Manga Larga Grid | `polera-manga-larga-grid.jpg` |

### Zapatillas — foto cuadrada

| Producto | Nombre de archivo sugerido |
| --- | --- |
| Zapatillas Vulc Low | `zapatillas-vulc-low.jpg` |
| Zapatillas Cupsole Pro | `zapatillas-cupsole-pro.jpg` |
| Zapatillas Mid Canvas | `zapatillas-mid-canvas.jpg` |

---

## El banner del home y las fotos de categoría

Estas dos **no** están en `products.ts`, porque no pertenecen a ningún producto. Están arriba
de `src/app/page.tsx`:

```ts
/** Banner de portada. Formato horizontal, mínimo 1920x1080. */
const HERO_IMAGEN: string | null = null

/** Una foto por categoría, cuadrada. */
const IMAGEN_CATEGORIA: Record<string, string | null> = {
  tablas: null,
  gorros: null,
  polerones: null,
  poleras: null,
  zapatillas: null,
}
```

Se llenan igual que los productos:

```ts
const HERO_IMAGEN: string | null = '/images/hero.jpg'

const IMAGEN_CATEGORIA: Record<string, string | null> = {
  tablas: '/images/categoria-tablas.jpg',
  gorros: '/images/categoria-gorros.jpg',
  polerones: null,      // esta todavía no, y no pasa nada
  poleras: null,
  zapatillas: null,
}
```

**Si querés un video en el hero** en vez de una foto: en ese mismo archivo, dentro de la
sección del hero, reemplazá el `<Placeholder>` por un `<video>`:

```tsx
<video
  autoPlay
  muted
  loop
  playsInline
  poster="/images/hero-poster.jpg"
  className="h-full w-full object-cover"
>
  <source src="/images/hero.mp4" type="video/mp4" />
</video>
```

`muted` es obligatorio o el navegador no deja que arranque solo. El `poster` es la imagen que
se ve mientras el video carga — no la omitas, o el hero queda negro los primeros segundos.

**Importante:** no toques el degradado que está justo debajo. Es lo que le da contraste al
título sobre cualquier imagen. Sin él, un banner claro deja el texto ilegible.

---

## Tamaños y formatos

| Uso | Proporción | Tamaño mínimo | Formato |
| --- | --- | --- | --- |
| Tablas | Vertical 3:4 | 1200 × 1600 | JPG |
| Gorros, polerones, poleras, zapatillas | Cuadrada 1:1 | 1200 × 1200 | JPG |
| Categorías del home | Cuadrada 1:1 | 800 × 800 | JPG |
| Banner del hero | Horizontal 16:9 | 1920 × 1080 | JPG |
| Video del hero | Horizontal 16:9 | 1920 × 1080 | MP4 (H.264) |
| Logo | — | 240 × 48 aprox. | SVG, o PNG con fondo transparente |
| Imagen para compartir en redes | 1.91:1 | 1200 × 630 | JPG o PNG |

Tres cosas que conviene saber:

**No comprimas las fotos antes de subirlas.** Next genera solo las versiones optimizadas para
cada tamaño de pantalla y las convierte a WebP. Si le das una foto ya machacada, el resultado
final se ve peor. Subí la buena, hasta unos 2 MB por archivo está bien.

**Las fotos se recortan desde el centro.** El código usa `object-cover`, que llena el espacio
recortando en vez de deformar. Así que dejá el producto centrado en la foto: si está pegado a
un borde, se puede perder en el recorte. Una foto cuadrada en la ficha de una tabla se recorta
a vertical, y viceversa en el catálogo.

**El video pesa.** Un MP4 de más de 5 MB va a hacer que el home cargue lento en celular. Si el
banner es video, apuntá a 3 MB o menos, o usá una foto para móvil.

---

## Cómo ver el resultado

Con `npm run dev` corriendo, guardar el archivo alcanza — la página se actualiza sola.

Si agregás un archivo **nuevo** a `public/images/` y no aparece, recargá el navegador con
**Ctrl+F5** (recarga forzada, ignora la caché).

Antes de publicar, conviene correr una vez:

```
npm run build
```

Si eso termina sin errores, el sitio está sano.

---

## Cómo publicarlo

Cuando estés conforme:

```
git add -A
git commit -m "agrega fotos de tablas y gorros"
git push
```

Vercel detecta el push y redespliega solo. En uno o dos minutos la URL pública ya muestra las
fotos nuevas — no hay que hacer nada más ni avisarle a nadie.

Si trabajás desde dos computadores, acordate de hacer `git pull` **antes** de empezar en el
otro, o vas a tener que resolver conflictos.

---

## Problemas frecuentes

**Veo el ícono de imagen rota en vez de la foto.**
La ruta no coincide con el archivo. Revisá tres cosas, en este orden: que la ruta empiece con
`/images/` y no con `public/images/`; que el nombre esté idéntico, incluidas mayúsculas y la
extensión; y que el archivo esté realmente en `public/images/`.

Vale la pena saber que **esto no hace fallar el build**: `npm run build` compila igual, y el
error recién aparece en el navegador, donde el optimizador de imágenes responde un HTTP 400. O
sea que no confíes en el build para detectar una ruta mal escrita — hay que mirar la página.

**Sigo viendo el bloque gris con el nombre.**
El `imagen: null` no se cambió, o se cambió en otro producto. Fijate en el `slug` de la línea
de arriba para confirmar que es el producto correcto.

**La foto se ve cortada o descentrada.**
Es `object-cover` haciendo su trabajo: recorta desde el centro para no deformar. Recortá la
foto vos antes, dejando el producto centrado, o cambiá la proporción del archivo a la que
sugiere la tabla de tamaños.

**La foto se ve borrosa.**
El archivo es más chico que el espacio donde se muestra. Revisá los mínimos de la tabla.

**Puse un archivo `.png` y no anda.**
Sí funciona, pero acordate de escribir la extensión correcta en la ruta: `.png`, no `.jpg`.

**Cambié el nombre del archivo y ahora no carga.**
Hay que actualizar también la ruta en `products.ts`. Son dos lugares que tienen que coincidir.

---

## Checklist

- [ ] Fotos renombradas con el slug, en minúsculas, con guiones, sin tildes
- [ ] Archivos copiados a `public/images/`
- [ ] `imagen: null` reemplazado en `src/data/products.ts` para cada foto que tengas
- [ ] `HERO_IMAGEN` en `src/app/page.tsx` si tenés banner
- [ ] `IMAGEN_CATEGORIA` en `src/app/page.tsx` si tenés fotos de categoría
- [ ] Logo en `src/components/layout/Header.tsx`
- [ ] Redes sociales y datos de contacto reales en `src/components/layout/Footer.tsx`
- [ ] Imagen de Open Graph en `src/app/layout.tsx` (la que se ve al compartir el link)
- [ ] `npm run build` pasa sin errores
- [ ] Revisado en el navegador, incluido el celular
- [ ] `git push` hecho, Vercel redesplegó

---

Cualquier cosa que no esté acá, está en el [README](README.md).
