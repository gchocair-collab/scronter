'use client'

import { useRef, useState } from 'react'
// `JSX` se importa explícitamente: @types/react 19 dejó de declarar el namespace
// JSX global, así que `JSX.Element` a secas ya no resuelve.
import type { FormEvent, JSX } from 'react'
import Link from 'next/link'
import type { Buyer, CartLine } from '@/types'
import { useCartHydrated, useCartLines } from '@/store/cart'
import { cn } from '@/lib/format'
import { Button } from '@/components/ui/Button'

/* ============================================================================
   SCRONTER — FORMULARIO DE CHECKOUT
   ============================================================================

   Es el último paso antes de salir del sitio: acá se juntan los datos de
   despacho y se crea el pago en Flow. Tres decisiones que conviene entender
   antes de tocar este archivo:

   1. Al servidor se le mandan SOLO IDs y cantidades (`CartLine[]`) más los
      datos del comprador. Ni el total, ni los precios unitarios. Ver el
      comentario grande sobre esto en `enviar()`.

   2. La validación es en el cliente pero NO es la validación de verdad — es
      cortesía, para no hacer ir y volver al servidor por un email mal escrito.
      La validación que importa (stock, precios, montos) vive en
      `lib/orders/store.ts` y corre en el servidor igual, siempre.

   3. El carrito NO se vacía acá. Si el pago se rechaza, el comprador vuelve y
      su carrito sigue armado. Se limpia recién en la confirmación, y solo si
      Flow dijo que se pagó.
   ============================================================================ */

/** Los campos del formulario son exactamente los de `Buyer` — no se redeclaran
 *  para que agregar un dato al comprador rompa acá y no se olvide. */
type CampoBuyer = keyof Buyer

type Errores = Partial<Record<CampoBuyer, string>>

const VACIO: Buyer = {
  nombre: '',
  email: '',
  telefono: '',
  direccion: '',
  comuna: '',
  ciudad: '',
}

/**
 * Formato de email "razonable", no RFC 5322.
 * Un regex exhaustivo de email es enorme y termina rechazando direcciones
 * válidas. Acá solo se atajan los errores de tipeo reales (falta el @, falta el
 * punto del dominio, sobra un espacio); si igual está mal, el mail no llega y
 * de eso se enteran por el teléfono que también pedimos.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Cuenta solo dígitos: así "+56 9 1234 5678" pasa igual que "912345678". */
function digitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

/** Devuelve un mensaje por campo inválido. Cada mensaje dice qué pasó Y cómo
 *  arreglarlo — "Campo requerido" no le sirve a nadie. */
function validar(form: Buyer): Errores {
  const e: Errores = {}

  if (form.nombre.trim().length < 3) {
    e.nombre = 'Falta tu nombre. Escribí nombre y apellido, como aparece en tu cédula.'
  }

  if (form.email.trim() === '') {
    e.email = 'Falta tu email. Ahí te mandamos el comprobante y el seguimiento del envío.'
  } else if (!EMAIL_RE.test(form.email.trim())) {
    e.email = 'Ese email no parece válido. Revisá que tenga un @ y un dominio, por ejemplo nombre@correo.cl'
  }

  if (form.telefono.trim() === '') {
    e.telefono = 'Falta tu teléfono. Lo usa el courier para coordinar la entrega.'
  } else if (digitos(form.telefono).length < 8) {
    e.telefono = 'El teléfono es muy corto: escribí al menos 8 dígitos, por ejemplo 9 1234 5678.'
  }

  if (form.direccion.trim().length < 5) {
    e.direccion = 'Falta la dirección. Incluí calle y número, y depto si corresponde.'
  }

  if (form.comuna.trim() === '') {
    e.comuna = 'Falta la comuna. Sin comuna no podemos cotizar el despacho.'
  }

  if (form.ciudad.trim() === '') {
    e.ciudad = 'Falta la ciudad o región.'
  }

  return e
}

export function CheckoutForm(): JSX.Element {
  const hidratado = useCartHydrated()
  const lineas = useCartLines()

  const [form, setForm] = useState<Buyer>(VACIO)
  const [errores, setErrores] = useState<Errores>({})
  const [errorServidor, setErrorServidor] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  /** Para mandar el foco al primer campo con error: con teclado o lector de
   *  pantalla, un error que aparece 300px más arriba pasa desapercibido. */
  const refs = useRef<Record<CampoBuyer, HTMLInputElement | null>>({
    nombre: null,
    email: null,
    telefono: null,
    direccion: null,
    comuna: null,
    ciudad: null,
  })

  function setCampo(campo: CampoBuyer, valor: string): void {
    setForm((prev) => ({ ...prev, [campo]: valor }))

    // El error del campo se borra al primer tecleo: dejarlo puesto mientras la
    // persona ya está corrigiendo se lee como que el sitio no responde.
    setErrores((prev) => {
      if (!prev[campo]) return prev
      const siguiente = { ...prev }
      delete siguiente[campo]
      return siguiente
    })
  }

  async function enviar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault()
    setErrorServidor(null)

    const encontrados = validar(form)
    const primerError = (Object.keys(encontrados) as CampoBuyer[]).find((c) => encontrados[c])

    if (primerError) {
      setErrores(encontrados)
      refs.current[primerError]?.focus()
      return
    }

    setErrores({})
    setEnviando(true)

    /* ------------------------------------------------------------------------
       ⚠️  SEGURIDAD: acá NO va el total, y NO van los precios.
       ------------------------------------------------------------------------
       El body lleva únicamente productId + variantId + cantidad. El servidor
       busca cada producto en el catálogo y recalcula el monto con
       `calcularTotal()`.

       Si el monto lo mandara el cliente, cualquiera podría abrir devtools,
       editar el fetch y pagar $350 por una tabla de $62.000 — y Flow cobraría
       esos $350 sin protestar, porque para Flow el monto correcto es el que le
       manda el comercio. La única defensa es que el navegador nunca tenga voz
       en el precio.

       Por lo mismo se mandan las líneas ya resueltas contra el catálogo
       (`useCartLines`): si un localStorage viejo apunta a un producto que ya no
       existe, esa línea se descartó antes y el servidor no la ve.
       ------------------------------------------------------------------------ */
    const lines: CartLine[] = lineas.map((l) => ({
      productId: l.productId,
      variantId: l.variantId,
      cantidad: l.cantidad,
    }))

    const buyer: Buyer = {
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      telefono: form.telefono.trim(),
      direccion: form.direccion.trim(),
      comuna: form.comuna.trim(),
      ciudad: form.ciudad.trim(),
    }

    try {
      const res = await fetch('/api/flow/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines, buyer }),
      })

      const data: { redirectUrl?: string; error?: string } = await res.json()

      if (!res.ok || data.error || !data.redirectUrl) {
        setErrorServidor(
          data.error ?? 'No pudimos iniciar el pago. Intentá de nuevo en unos segundos.',
        )
        setEnviando(false)
        return
      }

      // Navegación a un dominio externo (Flow): tiene que ser el navegador, no
      // el router de Next. `router.push` solo entiende rutas de esta app y no
      // sale del sitio.
      // Ojo: NO se hace setEnviando(false) — el botón queda deshabilitado
      // mientras el navegador cambia de página, así nadie alcanza a crear un
      // segundo pago con doble clic.
      window.location.href = data.redirectUrl
    } catch {
      // Cae acá si se cortó la red o el servidor devolvió algo que no es JSON.
      setErrorServidor(
        'Se cortó la conexión antes de llegar a Flow. Revisá tu internet y volvé a intentar.',
      )
      setEnviando(false)
    }
  }

  /* Mientras el store no leyó el localStorage, `lineas` está vacío. Si se
     mostrara el estado "carrito vacío" en ese instante, todo el mundo vería un
     falso vacío por un frame antes de que aparezca el formulario. */
  if (!hidratado) {
    return (
      <div className="border border-line bg-surface p-6">
        <p className="text-sm text-muted">Cargando tu carrito…</p>
      </div>
    )
  }

  if (lineas.length === 0) {
    return (
      <div className="border border-line bg-surface p-6 sm:p-8">
        <h2 className="text-2xl">Tu carrito está vacío</h2>
        <p className="mt-3 text-sm text-muted">
          No hay nada que pagar todavía. Elegí algo de la tienda y volvé a este paso.
        </p>
        <Link
          href="/tienda"
          className="mt-6 inline-flex items-center rounded-sm border border-line px-5 py-3 text-xs uppercase tracking-widest text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Ir a la tienda
        </Link>
      </div>
    )
  }

  return (
    // noValidate desactiva la validación del navegador a propósito: sus globos
    // amarillos aparecen en el idioma del sistema, no se pueden estilar y tapan
    // los mensajes propios. La validación la hace `validar()`.
    <form noValidate onSubmit={enviar} className="border border-line bg-surface p-6 sm:p-8">
      <h2 className="text-xl sm:text-2xl">Datos de despacho</h2>
      <p className="mt-2 text-sm text-muted">
        Todos los campos son obligatorios. Los usamos para el envío y para avisarte del pago.
      </p>

      <div className="mt-8 space-y-6">
        <Campo
          id="nombre"
          label="Nombre y apellido"
          valor={form.nombre}
          error={errores.nombre}
          autoComplete="name"
          placeholder="Camila Ríos"
          onChange={(v) => setCampo('nombre', v)}
          inputRef={(el) => {
            refs.current.nombre = el
          }}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <Campo
            id="email"
            label="Email"
            tipo="email"
            inputMode="email"
            valor={form.email}
            error={errores.email}
            autoComplete="email"
            placeholder="camila@correo.cl"
            onChange={(v) => setCampo('email', v)}
            inputRef={(el) => {
              refs.current.email = el
            }}
          />
          <Campo
            id="telefono"
            label="Teléfono"
            tipo="tel"
            inputMode="tel"
            valor={form.telefono}
            error={errores.telefono}
            autoComplete="tel"
            placeholder="9 1234 5678"
            onChange={(v) => setCampo('telefono', v)}
            inputRef={(el) => {
              refs.current.telefono = el
            }}
          />
        </div>

        <Campo
          id="direccion"
          label="Dirección"
          valor={form.direccion}
          error={errores.direccion}
          autoComplete="street-address"
          placeholder="Av. Siempre Viva 742, depto 12"
          onChange={(v) => setCampo('direccion', v)}
          inputRef={(el) => {
            refs.current.direccion = el
          }}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <Campo
            id="comuna"
            label="Comuna"
            valor={form.comuna}
            error={errores.comuna}
            autoComplete="address-level3"
            placeholder="Ñuñoa"
            onChange={(v) => setCampo('comuna', v)}
            inputRef={(el) => {
              refs.current.comuna = el
            }}
          />
          <Campo
            id="ciudad"
            label="Ciudad o región"
            valor={form.ciudad}
            error={errores.ciudad}
            autoComplete="address-level2"
            placeholder="Santiago"
            onChange={(v) => setCampo('ciudad', v)}
            inputRef={(el) => {
              refs.current.ciudad = el
            }}
          />
        </div>
      </div>

      {/* Error del servidor (stock insuficiente, Flow caído, credenciales mal).
          Va arriba del botón para que se vea sin scrollear después de tocarlo. */}
      {errorServidor && (
        <div
          role="alert"
          className="mt-8 rounded-sm border border-danger/40 bg-danger/10 p-4 text-sm text-danger"
        >
          {errorServidor}
        </div>
      )}

      <Button type="submit" size="lg" disabled={enviando} className="mt-8 w-full">
        {enviando ? 'Redirigiendo a Flow…' : 'Pagar con Flow'}
      </Button>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Al continuar te llevamos al sitio seguro de Flow para elegir el medio de pago. Los datos de
        tu tarjeta se ingresan allá: nunca pasan por Scronter.
      </p>
    </form>
  )
}

/* ============================================================================
   CAMPO
   Un input con su label, su error y el cableado de accesibilidad. Vive acá y no
   en components/ui porque hoy solo lo usa este formulario; si aparece un segundo
   formulario (contacto, newsletter), recién ahí conviene moverlo.
   ============================================================================ */
function Campo(props: {
  id: CampoBuyer
  label: string
  valor: string
  error?: string
  tipo?: 'text' | 'email' | 'tel'
  inputMode?: 'text' | 'email' | 'tel'
  autoComplete?: string
  placeholder?: string
  onChange: (valor: string) => void
  inputRef: (el: HTMLInputElement | null) => void
  className?: string
}): JSX.Element {
  const idError = `${props.id}-error`

  return (
    <div className={props.className}>
      <label
        htmlFor={props.id}
        className="block text-xs uppercase tracking-widest text-muted"
      >
        {props.label}
      </label>

      <input
        id={props.id}
        name={props.id}
        ref={props.inputRef}
        type={props.tipo ?? 'text'}
        inputMode={props.inputMode}
        autoComplete={props.autoComplete}
        placeholder={props.placeholder}
        value={props.valor}
        onChange={(e) => props.onChange(e.target.value)}
        // aria-invalid + aria-describedby: sin esto un lector de pantalla lee
        // el campo como si estuviera bien y nunca menciona el mensaje de error.
        aria-invalid={props.error ? true : undefined}
        aria-describedby={props.error ? idError : undefined}
        className={cn(
          'mt-2 w-full rounded-sm border bg-raised px-3 py-3 text-sm text-ink',
          'placeholder:text-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          props.error ? 'border-danger' : 'border-line',
        )}
      />

      {props.error && (
        <p id={idError} role="alert" className="mt-2 text-xs leading-relaxed text-danger">
          {props.error}
        </p>
      )}
    </div>
  )
}
