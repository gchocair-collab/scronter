'use client'

import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import Link from 'next/link'
import { TIPO_VARIANTE_ARTICULO, type Product, type Variant } from '@/types'
import { totalStock } from '@/data/products'
import { useCart } from '@/store/cart'
import { Button } from '@/components/ui/Button'
import { QuantityStepper } from '@/components/product/QuantityStepper'
import { VariantSelector } from '@/components/product/VariantSelector'

/* ============================================================================
   SCRONTER — BLOQUE DE COMPRA DEL DETALLE
   ============================================================================

   Es la única isla cliente de la página de producto: acá vive el estado
   (variante elegida, cantidad, confirmación) y todo el resto del detalle sigue
   siendo Server Component. Por eso el estado NO se sube a la página.

   Regla de negocio que se respeta en toda la UI: el stock es por variante, no
   por producto. Podés tener 12 poleras y cero en L.
   ============================================================================ */

/** Cuánto queda visible el aviso de "agregado" antes de desaparecer. */
const MS_CONFIRMACION = 4000

export function AddToCart({ producto }: { producto: Product }): JSX.Element {
  const addLine = useCart((s) => s.addLine)

  // Si hay una sola variante (gorro de talla única) no tiene sentido obligar a
  // elegirla: se preselecciona y el comprador queda a un click de comprar.
  const unica = producto.variantes.length === 1 ? producto.variantes[0] : undefined

  const [variantId, setVariantId] = useState<string | null>(
    unica && unica.stock > 0 ? unica.id : null,
  )
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)

  // El timer se guarda en un ref para poder reiniciarlo si el comprador agrega
  // dos veces seguidas: si no, el segundo aviso se apagaría con el reloj del
  // primero, a mitad de camino.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const variante: Variant | undefined = producto.variantes.find((v) => v.id === variantId)
  const stockDisponible = variante?.stock ?? 0
  const sinStockEnNingunaVariante = totalStock(producto) === 0

  function elegirVariante(id: string): void {
    setVariantId(id)

    // La cantidad se arrastra al cambiar de variante, pero la variante nueva
    // puede tener menos stock: si venías con 5 de la talla M y pasás a la L, que
    // tiene 2, la bajamos a 2 en vez de dejar que el store la recorte en
    // silencio después de apretar "Agregar".
    const nueva = producto.variantes.find((v) => v.id === id)
    if (nueva && cantidad > nueva.stock) setCantidad(Math.max(1, nueva.stock))

    // El aviso viejo ya no corresponde: era de otra variante.
    setAgregado(false)
  }

  function agregar(): void {
    if (!variante || variante.stock === 0) return

    addLine(producto, variante, cantidad)

    // Confirmación inline en vez de alert(): un alert bloquea el hilo, se ve
    // como error del navegador y en móvil tapa la pantalla completa.
    setAgregado(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setAgregado(false), MS_CONFIRMACION)
  }

  /* El texto del botón es el que explica por qué está deshabilitado. Un botón
     gris sin explicación es el motivo número uno de abandono en un detalle. */
  const etiquetaBoton = sinStockEnNingunaVariante
    ? 'Agotado'
    : !variante
      ? `Elegí ${TIPO_VARIANTE_ARTICULO[producto.tipoVariante]}`
      : variante.stock === 0
        ? 'Sin stock'
        : 'Agregar al carrito'

  const deshabilitado = sinStockEnNingunaVariante || !variante || variante.stock === 0

  return (
    <div className="space-y-6">
      <VariantSelector
        variantes={producto.variantes}
        tipo={producto.tipoVariante}
        seleccionada={variantId}
        onSelect={elegirVariante}
      />

      <div>
        <p className="mb-2 text-xs uppercase tracking-widest text-muted">Cantidad</p>
        <div className="flex flex-wrap items-center gap-4">
          <QuantityStepper valor={cantidad} max={stockDisponible} onChange={setCantidad} />

          {/* Aviso de stock bajo: empuja la decisión sin mentir. Solo aparece
              cuando ya hay variante elegida, porque el stock es de ella. */}
          {variante && variante.stock > 0 && variante.stock <= 3 && (
            <span className="text-xs uppercase tracking-widest text-warn">
              {variante.stock === 1 ? 'Última unidad' : `Quedan ${variante.stock}`}
            </span>
          )}
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={agregar}
        disabled={deshabilitado}
        className="w-full sm:w-auto"
      >
        {etiquetaBoton}
      </Button>

      {/* role="status" hace que el lector de pantalla anuncie la confirmación
          sin robarle el foco al botón, así se puede seguir agregando. */}
      <div role="status" aria-live="polite" className="min-h-6">
        {agregado && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
            <span className="text-accent">Agregado al carrito</span>
            <Link href="/carrito" className="uppercase tracking-widest text-xs underline hover:text-accent">
              Ver carrito
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
