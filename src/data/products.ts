import type { Category, Product } from '@/types'

/* ============================================================================
   SCRONTER — CATÁLOGO
   ============================================================================

   Data de ejemplo. Cuando conectes un CMS o una base de datos, reemplazá este
   archivo por el fetch correspondiente y dejá las mismas funciones exportadas
   al final (`getProductBySlug`, `getProductsByCategory`, etc.) — así ninguna
   página ni componente necesita cambiar.

   IMÁGENES: todas están en `null`, que significa "todavía no hay foto". El
   componente <Placeholder> dibuja entonces un bloque con el nombre del
   producto, así que el sitio nunca se ve roto ni con imágenes cortadas.

   Para agregar una foto: copiás el archivo a /public/images/ y cambiás el
   `null` por su ruta, por ejemplo '/images/tabla-concrete-jungle.jpg'.
   Se puede hacer de a una: las que sigan en null muestran el bloque.
   Paso a paso completo en IMAGENES.md.

   PRECIOS: enteros CLP. Mínimo que acepta Flow: 350.
   ============================================================================ */

/** Talla de ropa estándar. Se repite en polerones y poleras. */
const tallasRopa = (stock: [number, number, number, number]) => [
  { id: 'S', label: 'S', stock: stock[0] },
  { id: 'M', label: 'M', stock: stock[1] },
  { id: 'L', label: 'L', stock: stock[2] },
  { id: 'XL', label: 'XL', stock: stock[3] },
]

export const products: Product[] = [
  /* ---------------------------------------------------------------- TABLAS -- */
  {
    id: 'tbl-001',
    slug: 'tabla-concrete-jungle',
    nombre: 'Tabla Concrete Jungle',
    categoria: 'tablas',
    precio: 52990,
    descripcionCorta: 'Maple canadiense de 7 capas, cóncavo medio.',
    descripcion:
      'Siete capas de maple canadiense prensado en frío, cóncavo medio y nose ligeramente más alta que el tail. Equilibrada para transición y street — responde bien en bowl sin volverse impredecible en flatground. Viene sin lija.',
    imagen: null,
    tipoVariante: 'medida',
    variantes: [
      { id: '8-0', label: '8.0"', stock: 6 },
      { id: '8-25', label: '8.25"', stock: 4 },
      { id: '8-5', label: '8.5"', stock: 2 },
    ],
    destacado: true,
  },
  {
    id: 'tbl-002',
    slug: 'tabla-nightshift',
    nombre: 'Tabla Nightshift',
    categoria: 'tablas',
    precio: 48990,
    descripcionCorta: 'Cóncavo profundo, para quien vive en el bowl.',
    descripcion:
      'Cóncavo profundo y wheelbase corto: gira cerrado y bloquea el pie en los grabs. Pensada para bowl y vert más que para street. Serigrafía a dos tintas sobre fondo negro mate.',
    imagen: null,
    tipoVariante: 'medida',
    variantes: [
      { id: '8-25', label: '8.25"', stock: 5 },
      { id: '8-5', label: '8.5"', stock: 5 },
      { id: '8-75', label: '8.75"', stock: 3 },
    ],
    destacado: true,
  },
  {
    id: 'tbl-003',
    slug: 'tabla-first-push',
    nombre: 'Tabla First Push',
    categoria: 'tablas',
    precio: 39990,
    descripcionCorta: 'La de entrada. Cóncavo suave, perdona errores.',
    descripcion:
      'Cóncavo suave y tail más plano, que hace el ollie más fácil de encontrar cuando estás aprendiendo. Misma construcción de 7 capas que el resto de la línea, sin gráfica premium para bajar el precio. Si es tu primera tabla, es esta.',
    imagen: null,
    tipoVariante: 'medida',
    variantes: [
      { id: '7-75', label: '7.75"', stock: 8 },
      { id: '8-0', label: '8.0"', stock: 10 },
    ],
    destacado: false,
  },
  {
    id: 'tbl-004',
    slug: 'tabla-grip-tape-og',
    nombre: 'Tabla Grip Tape OG',
    categoria: 'tablas',
    precio: 61990,
    descripcionCorta: 'Edición limitada. Fondo negro, sin gráfica.',
    descripcion:
      'Serie limitada sin serigrafía: solo el veteado del maple teñido en negro y el logo troquelado en el tail. Construcción idéntica a la Concrete Jungle. Tirada corta — cuando se agota no vuelve.',
    imagen: null,
    tipoVariante: 'medida',
    variantes: [
      { id: '8-25', label: '8.25"', stock: 2 },
      { id: '8-5', label: '8.5"', stock: 1 },
    ],
    destacado: true,
  },

  /* ---------------------------------------------------------------- GORROS -- */
  {
    id: 'gor-001',
    slug: 'gorro-beanie-scronter',
    nombre: 'Beanie Scronter',
    categoria: 'gorros',
    precio: 17990,
    descripcionCorta: 'Acrílico grueso, doblez ancho, logo bordado.',
    descripcion:
      'Tejido acrílico grueso con doblez ancho y logo bordado al frente. Talla única elasticada. Aguanta invierno santiaguino sin picar.',
    imagen: null,
    tipoVariante: 'talla',
    variantes: [{ id: 'unica', label: 'Única', stock: 14 }],
    destacado: true,
  },
  {
    id: 'gor-002',
    slug: 'gorro-5-panel-flat',
    nombre: '5-Panel Flat',
    categoria: 'gorros',
    precio: 21990,
    descripcionCorta: 'Visera plana, cinco paneles, cierre metálico.',
    descripcion:
      'Cinco paneles en algodón sarga, visera plana y cierre metálico regulable. Estructura media: mantiene forma sin quedar tiesa. Logo bordado en relieve en el panel frontal.',
    imagen: null,
    tipoVariante: 'talla',
    variantes: [{ id: 'unica', label: 'Única', stock: 9 }],
    destacado: false,
  },
  {
    id: 'gor-003',
    slug: 'gorro-bucket-washed',
    nombre: 'Bucket Washed',
    categoria: 'gorros',
    precio: 19990,
    descripcionCorta: 'Algodón lavado a la piedra, ala corta.',
    descripcion:
      'Algodón lavado a la piedra que arranca ya con textura usada y se ablanda más con cada lavado. Ala corta para que no moleste al mirar hacia arriba. Etiqueta tejida en el borde interno.',
    imagen: null,
    tipoVariante: 'talla',
    variantes: [
      { id: 'S-M', label: 'S/M', stock: 5 },
      { id: 'L-XL', label: 'L/XL', stock: 6 },
    ],
    destacado: false,
  },

  /* ------------------------------------------------------------- POLERONES -- */
  {
    id: 'pol-001',
    slug: 'poleron-heavyweight-negro',
    nombre: 'Polerón Heavyweight Negro',
    categoria: 'polerones',
    precio: 54990,
    descripcionCorta: '450 g/m², capucha doble, logo al pecho.',
    descripcion:
      'Algodón peinado de 450 g/m² — de los que caen con peso y no se deforman en el primer lavado. Capucha de doble capa, puños y cintura elasticados, bolsillo canguro. Logo bordado chico al pecho.',
    imagen: null,
    tipoVariante: 'talla',
    variantes: tallasRopa([4, 7, 6, 3]),
    destacado: true,
  },
  {
    id: 'pol-002',
    slug: 'poleron-zip-concrete',
    nombre: 'Polerón Zip Concrete',
    categoria: 'polerones',
    precio: 58990,
    descripcionCorta: 'Cierre completo, gris cemento, bolsillos laterales.',
    descripcion:
      'Cierre metálico de largo completo con tirador de cordón, en gris cemento jaspeado. Dos bolsillos laterales con apertura vertical. Interior perchado. Calza recto, sin ser oversize.',
    imagen: null,
    tipoVariante: 'talla',
    variantes: tallasRopa([3, 5, 5, 2]),
    destacado: false,
  },
  {
    id: 'pol-003',
    // El slug va sin tilde a propósito: es lo que viaja en la URL, y un
    // carácter acentuado obliga al navegador a percent-encodearlo
    // (flúor → fl%C3%BAor), lo que rompe los links escritos a mano y ensucia
    // el SEO. El nombre visible sí lleva tilde.
    slug: 'poleron-crewneck-fluor',
    nombre: 'Polerón Crewneck Flúor',
    categoria: 'polerones',
    precio: 49990,
    descripcionCorta: 'Cuello redondo, estampado flúor a la espalda.',
    descripcion:
      'Cuello redondo sin capucha, algodón 380 g/m². Estampado grande en la espalda en verde flúor sobre negro, aplicado en serigrafía plastisol para que aguante. Sin bolsillo, corte limpio.',
    imagen: null,
    tipoVariante: 'talla',
    variantes: tallasRopa([6, 8, 4, 0]),
    destacado: true,
  },

  /* --------------------------------------------------------------- POLERAS -- */
  {
    id: 'ple-001',
    slug: 'polera-logo-clasica',
    nombre: 'Polera Logo Clásica',
    categoria: 'poleras',
    precio: 19990,
    descripcionCorta: 'Algodón 220 g/m², logo al centro del pecho.',
    descripcion:
      'Algodón 220 g/m² con cuello reforzado con cinta al hombro. Logo serigrafiado al centro del pecho. Calce regular, largo estándar. La camiseta base de la marca.',
    imagen: null,
    tipoVariante: 'talla',
    variantes: tallasRopa([10, 12, 9, 5]),
    destacado: true,
  },
  {
    id: 'ple-002',
    slug: 'polera-oversize-street',
    nombre: 'Polera Oversize Street',
    categoria: 'poleras',
    precio: 24990,
    descripcionCorta: 'Corte ancho, hombro caído, 240 g/m².',
    descripcion:
      'Corte deliberadamente ancho con hombro caído y manga más larga, en algodón de 240 g/m². Estampado grande a la espalda y etiqueta tejida al ruedo. Si querés el calce ajustado, bajá una talla.',
    imagen: null,
    tipoVariante: 'talla',
    variantes: tallasRopa([5, 9, 8, 4]),
    destacado: false,
  },
  {
    id: 'ple-003',
    slug: 'polera-manga-larga-grid',
    nombre: 'Polera Manga Larga Grid',
    categoria: 'poleras',
    precio: 27990,
    descripcionCorta: 'Manga larga, estampado en mangas y pecho.',
    descripcion:
      'Manga larga con puño elasticado y estampado corrido a lo largo de las dos mangas más un logo chico al pecho. Algodón 220 g/m². Funciona sola en otoño o de primera capa en invierno.',
    imagen: null,
    tipoVariante: 'talla',
    variantes: tallasRopa([4, 6, 6, 3]),
    destacado: false,
  },

  /* ------------------------------------------------------------ ZAPATILLAS -- */
  {
    id: 'zap-001',
    slug: 'zapatillas-vulc-low',
    nombre: 'Zapatillas Vulc Low',
    categoria: 'zapatillas',
    precio: 64990,
    descripcionCorta: 'Suela vulcanizada, lona reforzada, caña baja.',
    descripcion:
      'Suela vulcanizada que da sensación directa de la tabla y agarre parejo sobre la lija. Lona reforzada con panel de suede en la zona del ollie, que es donde primero se rompe todo. Caña baja, plantilla acolchada delgada.',
    imagen: null,
    tipoVariante: 'talla',
    variantes: [
      { id: '39', label: '39', stock: 3 },
      { id: '40', label: '40', stock: 5 },
      { id: '41', label: '41', stock: 6 },
      { id: '42', label: '42', stock: 4 },
      { id: '43', label: '43', stock: 2 },
      { id: '44', label: '44', stock: 1 },
    ],
    destacado: true,
  },
  {
    id: 'zap-002',
    slug: 'zapatillas-cupsole-pro',
    nombre: 'Zapatillas Cupsole Pro',
    categoria: 'zapatillas',
    precio: 78990,
    descripcionCorta: 'Cupsole con amortiguación, para impacto fuerte.',
    descripcion:
      'Construcción cupsole con entresuela de EVA: menos sensibilidad que una vulcanizada, mucho más amortiguación para caídas de altura. Suede completo en el upper y costuras triples en la punta. Para quien salta escaleras.',
    imagen: null,
    tipoVariante: 'talla',
    variantes: [
      { id: '40', label: '40', stock: 4 },
      { id: '41', label: '41', stock: 4 },
      { id: '42', label: '42', stock: 5 },
      { id: '43', label: '43', stock: 3 },
      { id: '44', label: '44', stock: 0 },
    ],
    destacado: false,
  },
  {
    id: 'zap-003',
    slug: 'zapatillas-mid-canvas',
    nombre: 'Zapatillas Mid Canvas',
    categoria: 'zapatillas',
    precio: 58990,
    descripcionCorta: 'Caña media, lona, tobillo con acolchado.',
    descripcion:
      'Caña media con collar acolchado que sujeta el tobillo sin restringir el flick. Lona liviana, pensada para verano. Suela vulcanizada con dibujo de espiga. La más liviana de la línea.',
    imagen: null,
    tipoVariante: 'talla',
    variantes: [
      { id: '39', label: '39', stock: 2 },
      { id: '40', label: '40', stock: 6 },
      { id: '41', label: '41', stock: 7 },
      { id: '42', label: '42', stock: 5 },
      { id: '43', label: '43', stock: 3 },
    ],
    destacado: false,
  },
]

/* ============================================================================
   ACCESO AL CATÁLOGO
   Todas las páginas usan estas funciones y nunca el array directo. Cuando
   migres a una DB, cambiás solo estos cuerpos.
   ============================================================================ */

export function getAllProducts(): Product[] {
  return products
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug)
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

export function getProductsByCategory(categoria: Category): Product[] {
  return products.filter((p) => p.categoria === categoria)
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.destacado)
}

/** Stock total de un producto, sumando todas sus variantes. */
export function totalStock(p: Product): number {
  return p.variantes.reduce((acc, v) => acc + v.stock, 0)
}
