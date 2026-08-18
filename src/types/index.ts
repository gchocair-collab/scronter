/* ============================================================================
   SCRONTER — CONTRATO DE TIPOS
   Todo el proyecto importa desde acá. Si un tipo cambia, TypeScript te muestra
   exactamente qué archivos hay que ajustar.
   ============================================================================ */

/** Las cinco categorías de la tienda. Agregar una acá obliga a agregarla
 *  también en `CATEGORIAS` (abajo) — a propósito, así el filtro nunca queda
 *  desincronizado del tipo. */
export type Category = 'tablas' | 'gorros' | 'polerones' | 'poleras' | 'zapatillas'

/** Etiquetas legibles para la UI. El `Record<Category, string>` fuerza que
 *  estén las cinco: si agregás una categoría al tipo y te olvidás de acá,
 *  no compila. */
export const CATEGORIA_LABEL: Record<Category, string> = {
  tablas: 'Tablas',
  gorros: 'Gorros',
  polerones: 'Polerones',
  poleras: 'Poleras',
  zapatillas: 'Zapatillas',
}

/** Orden en que se muestran los filtros y las secciones del home. */
export const CATEGORIAS: Category[] = ['tablas', 'gorros', 'polerones', 'poleras', 'zapatillas']

/**
 * Una variante concreta y comprable de un producto.
 * El stock vive acá y no en el producto porque se agota por talla, no por
 * modelo: podés tener 12 poleras pero cero en L.
 */
export interface Variant {
  /** Único dentro del producto. Se usa como clave del carrito junto al productId. */
  id: string
  /** Lo que ve el comprador: '8.25"' · 'M' · '42' */
  label: string
  stock: number
}

export interface Product {
  id: string
  /** Va en la URL: /tienda/[slug]. Único en todo el catálogo. */
  slug: string
  nombre: string
  categoria: Category
  /**
   * Precio en CLP, entero. Sin decimales y sin separadores.
   * Flow rechaza montos no enteros, y el CLP no tiene centavos.
   * El formateo a "$45.000" es cosa de la vista (ver `lib/format.ts`).
   */
  precio: number
  descripcionCorta: string
  descripcion: string
  /**
   * Ruta de la foto del producto, relativa a /public. Ej: '/images/tabla-og.jpg'
   *
   * `null` significa "todavía no hay foto": el componente <Placeholder> dibuja
   * en su lugar un bloque con el nombre del producto. Es un estado explícito y
   * no un descuido — permite ir agregando las fotos de a una, sin que el sitio
   * se vea roto mientras faltan.
   *
   * Para agregar una foto: copiás el archivo a /public/images/ y reemplazás el
   * null por su ruta. Ver IMAGENES.md.
   */
  imagen: string | null
  /** Cómo rotular el selector en el detalle: "Medida" para tablas, "Talla" para ropa. */
  tipoVariante: 'medida' | 'talla'
  variantes: Variant[]
  /** Si aparece en la sección de destacados del home. */
  destacado: boolean
}

/* --------------------------------------------------------------------------
   CARRITO
   -------------------------------------------------------------------------- */

/**
 * Lo que realmente se guarda (y se persiste en localStorage).
 * Guarda IDs, NO precios ni nombres: si mañana cambiás el precio de una tabla,
 * los carritos abiertos toman el precio nuevo en vez de quedar con uno viejo
 * pegado en el storage del visitante.
 */
export interface CartLine {
  productId: string
  variantId: string
  cantidad: number
}

/** Una línea del carrito ya resuelta contra el catálogo, lista para renderizar. */
export interface CartLineView extends CartLine {
  producto: Product
  variante: Variant
  /** precio × cantidad */
  subtotal: number
}

/* --------------------------------------------------------------------------
   ÓRDENES Y PAGO
   -------------------------------------------------------------------------- */

/** Estados internos de la orden. Se derivan del `status` numérico de Flow
 *  (1 pendiente · 2 pagada · 3 rechazada · 4 anulada) en `lib/flow/client.ts`. */
export type OrderStatus = 'pendiente' | 'pagada' | 'rechazada' | 'anulada'

/** Datos del comprador que se piden en el checkout. */
export interface Buyer {
  nombre: string
  email: string
  telefono: string
  direccion: string
  comuna: string
  ciudad: string
}

export interface Order {
  /** Nuestro ID de orden. Es lo que viaja a Flow como `commerceOrder`.
   *  Máximo 40 caracteres y único por intento de pago. */
  commerceOrder: string
  lines: CartLine[]
  /** Total en CLP calculado EN EL SERVIDOR. Nunca se acepta del cliente. */
  total: number
  buyer: Buyer
  status: OrderStatus
  /** Token que devuelve Flow al crear el pago. */
  flowToken?: string
  /** Número de orden interno de Flow, útil para soporte. */
  flowOrder?: number
  /** Medio de pago informado por Flow (VISA, Mach, etc.), si lo hubo. */
  medioPago?: string
  createdAt: string
  paidAt?: string
}
