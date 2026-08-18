'use client'

import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartLine, CartLineView, Product, Variant } from '@/types'
import { getProductById } from '@/data/products'

/* ============================================================================
   SCRONTER — CARRITO (Zustand)
   ============================================================================

   ¿Por qué Zustand y no Context API?

   1. Persistencia. El carrito tiene que sobrevivir un refresh, y el middleware
      `persist` lo resuelve declarativamente. Con Context habría que escribir a
      mano la lectura inicial más un useEffect de sincronización, y encima
      manejar el desajuste de hidratación.

   2. App Router. Un Context obliga a envolver el árbol en un Provider marcado
      'use client', lo que empuja el layout hacia cliente. El store de Zustand
      lo importa directamente el componente que lo necesita, así que el layout
      y las páginas siguen siendo Server Components.

   3. Re-renders. Zustand suscribe por selector: al agregar un producto solo se
      re-renderiza el badge del header. Con Context se re-renderiza todo
      consumidor del contexto, incluida la grilla completa de productos.

   ────────────────────────────────────────────────────────────────────────────
   Lo que se guarda son IDs y cantidades — nunca precios ni nombres. Si mañana
   subís el precio de una tabla, los carritos abiertos toman el precio nuevo en
   vez de quedar con uno viejo congelado en el localStorage del visitante.
   ============================================================================ */

/** Clave compuesta: el mismo producto en dos tallas son dos líneas distintas. */
function esMismaLinea(l: CartLine, productId: string, variantId: string): boolean {
  return l.productId === productId && l.variantId === variantId
}

/** Techo de unidades para una variante, leído del catálogo. */
function stockDe(productId: string, variantId: string): number | undefined {
  return getProductById(productId)?.variantes.find((v) => v.id === variantId)?.stock
}

interface CartState {
  lines: CartLine[]
  addLine: (producto: Product, variante: Variant, cantidad: number) => void
  removeLine: (productId: string, variantId: string) => void
  setCantidad: (productId: string, variantId: string, cantidad: number) => void
  clear: () => void
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],

      addLine: (producto, variante, cantidad) =>
        set((state) => {
          const existente = state.lines.find((l) => esMismaLinea(l, producto.id, variante.id))

          // Si ya está en el carrito se suma, pero nunca por encima del stock
          // de esa variante — así el checkout no falla después con un error de
          // stock que el comprador no vio venir.
          if (existente) {
            const nueva = Math.min(existente.cantidad + cantidad, variante.stock)
            return {
              lines: state.lines.map((l) =>
                esMismaLinea(l, producto.id, variante.id) ? { ...l, cantidad: nueva } : l,
              ),
            }
          }

          return {
            lines: [
              ...state.lines,
              {
                productId: producto.id,
                variantId: variante.id,
                cantidad: Math.min(cantidad, variante.stock),
              },
            ],
          }
        }),

      removeLine: (productId, variantId) =>
        set((state) => ({
          lines: state.lines.filter((l) => !esMismaLinea(l, productId, variantId)),
        })),

      setCantidad: (productId, variantId, cantidad) =>
        set((state) => {
          // Bajar a 0 equivale a eliminar: evita líneas fantasma con cantidad cero.
          if (cantidad < 1) {
            return { lines: state.lines.filter((l) => !esMismaLinea(l, productId, variantId)) }
          }

          const techo = stockDe(productId, variantId) ?? cantidad

          return {
            lines: state.lines.map((l) =>
              esMismaLinea(l, productId, variantId)
                ? { ...l, cantidad: Math.min(cantidad, techo) }
                : l,
            ),
          }
        }),

      clear: () => set({ lines: [] }),
    }),
    {
      name: 'scronter-cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/* ============================================================================
   HIDRATACIÓN
   ============================================================================
   En el primer render del cliente el store todavía no leyó el localStorage, así
   que `lines` está vacío. Si el header pintara el badge en ese momento mostraría
   "0" y luego saltaría al número real — un parpadeo visible en cada carga.

   Este hook dice cuándo el store ya está listo, para poder no renderizar el
   badge hasta entonces.
   ============================================================================ */
export function useCartHydrated(): boolean {
  // Arranca SIEMPRE en false, incluso en el cliente. Dos razones:
  //
  // 1. SSR. El estado inicial de useState se evalúa también en el servidor,
  //    donde el middleware `persist` no está disponible (su storage depende de
  //    localStorage, que no existe ahí). Leer useCart.persist en el
  //    inicializador rompía el prerender con
  //    "Cannot read properties of undefined (reading 'hasHydrated')".
  //
  // 2. Hidratación. Servidor y primer render del cliente tienen que coincidir.
  //    Si el cliente arrancara en true porque el localStorage ya estaba leído,
  //    React reportaría un mismatch contra el HTML del servidor.
  //
  // El efecto corre solo en el cliente, después del primer render, y ahí sí es
  // seguro tocar la API de persist.
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // Si la rehidratación ya terminó antes de que este efecto corriera, el
    // listener no dispara nunca — de ahí la lectura directa además del listener.
    if (useCart.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    return useCart.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  return hydrated
}

/* ============================================================================
   SELECTORES DERIVADOS
   Se calculan contra el catálogo en cada render en vez de guardarse, así nunca
   quedan desincronizados de `data/products.ts`.
   ============================================================================ */

/** Líneas resueltas con producto, variante y subtotal. Descarta en silencio las
 *  que apunten a un producto o variante que ya no existe — por ejemplo un
 *  carrito viejo en localStorage después de que sacaste un modelo del catálogo. */
export function useCartLines(): CartLineView[] {
  const lines = useCart((s) => s.lines)

  return lines.flatMap((line) => {
    const producto = getProductById(line.productId)
    if (!producto) return []
    const variante = producto.variantes.find((v) => v.id === line.variantId)
    if (!variante) return []
    return [{ ...line, producto, variante, subtotal: producto.precio * line.cantidad }]
  })
}

/** Unidades totales, para el badge del header. */
export function useCartCount(): number {
  return useCart((s) => s.lines.reduce((acc, l) => acc + l.cantidad, 0))
}

/** Subtotal en CLP. Es solo para mostrar — el monto que efectivamente se cobra
 *  lo recalcula el servidor en `lib/orders/store.ts`. */
export function useCartSubtotal(): number {
  return useCartLines().reduce((acc, l) => acc + l.subtotal, 0)
}
