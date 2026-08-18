import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'

import { Badge } from '@/components/ui/Badge'
import { formatCLP, cn } from '@/lib/format'
import { getOrder } from '@/lib/orders/store'
import type { Order, OrderStatus } from '@/types'

/* ============================================================================
   SCRONTER — /confirmacion  ·  página de retorno de Flow
   ============================================================================

   ⚠️  CRÍTICO: ESTA PÁGINA SOLO LEE. NO DESPACHA NADA Y NO CAMBIA EL ESTADO
       DE NINGUNA ORDEN.

   Flow manda al comprador de vuelta acá cuando termina (o abandona) el pago.
   Ese redirect lo dispara el NAVEGADOR, y puede llegar ANTES que el webhook
   server-to-server de Flow — sobre todo con medios asíncronos (transferencia,
   efectivo en Servipag), donde el pago se confirma horas después.

   Si acá se llamara a `markOrderStatus(..., 'pagada')` estaríamos confiando en
   una pestaña del navegador para decidir si cobramos: cualquiera podría abrir
   /confirmacion?order=SCR-xxx a mano y darse la orden por pagada.

   El fulfillment (marcar pagada, descontar stock, mandar el mail, avisar a
   despacho) vive en UN solo lugar: /api/flow/confirmation, que valida la firma
   y consulta el estado real contra la API de Flow.

   Esta página, entonces, es un espejo: muestra lo que el webhook ya escribió.
   Por eso el estado 'pendiente' es un resultado normal y no un error.
   ============================================================================ */

export const metadata: Metadata = {
  title: 'Estado del pago',
}

/**
 * El estado de la orden cambia por fuera de esta request (lo escribe el
 * webhook). Si Next cacheara la respuesta, el comprador podría quedar mirando
 * "Pago en proceso" para siempre aunque el pago ya esté confirmado, y el botón
 * "Actualizar" no serviría de nada.
 */
export const dynamic = 'force-dynamic'

/* --------------------------------------------------------------------------
   TONOS
   Las clases se escriben completas y literales a propósito: Tailwind escanea
   el código fuente como texto, así que una clase armada por concatenación
   (`text-${tono}`) no se genera y el color simplemente no aparece.
   -------------------------------------------------------------------------- */
type Tono = 'ok' | 'warn' | 'danger' | 'muted'

const CLASES_TONO: Record<Tono, { texto: string; caja: string }> = {
  ok: { texto: 'text-ok', caja: 'border-ok/40 bg-ok/10 text-ok' },
  warn: { texto: 'text-warn', caja: 'border-warn/40 bg-warn/10 text-warn' },
  danger: { texto: 'text-danger', caja: 'border-danger/40 bg-danger/10 text-danger' },
  muted: { texto: 'text-muted', caja: 'border-line bg-raised text-muted' },
}

/* CTAs. Van como <Link>/<a> y no como <Button> por dos razones: navegan (no
   ejecutan nada), y un <button> dentro de un <a> es anidamiento inválido de
   elementos interactivos — el teclado y los lectores de pantalla se pierden. */
const CTA_BASE =
  'inline-flex items-center justify-center rounded-sm px-5 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors'
const CTA_PRIMARIO = `${CTA_BASE} bg-accent text-accent-ink hover:bg-accent-hover`
const CTA_FANTASMA = `${CTA_BASE} border border-line text-ink hover:bg-raised`

/* --------------------------------------------------------------------------
   PIEZAS DE UI (locales: solo las usa esta página)
   -------------------------------------------------------------------------- */

function Marco({ children }: { children: ReactNode }) {
  // El contenedor raíz es un <div>, no un <main>: el landmark <main> lo pone el
  // layout. Dos <main> anidados es HTML inválido y confunde a los lectores de
  // pantalla, que esperan encontrar uno solo por documento.
  return (
    <div className="shell py-12 sm:py-16">
      <section className="mx-auto max-w-xl border border-line bg-surface p-6 sm:p-8">
        {children}
      </section>
    </div>
  )
}

type TipoIcono = 'check' | 'reloj' | 'cruz' | 'barra' | 'duda'

function IconoEstado({ tipo, className }: { tipo: TipoIcono; className?: string }) {
  // Iconos dibujados inline: no hay librería de íconos y un SVG de 5 trazos no
  // justifica sumar una dependencia. `currentColor` hace que hereden el tono.
  const trazos: Record<TipoIcono, ReactNode> = {
    check: <path d="M5 12.5l4.5 4.5L19 7" />,
    reloj: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </>
    ),
    cruz: (
      <>
        <path d="M7 7l10 10" />
        <path d="M17 7L7 17" />
      </>
    ),
    barra: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M7 17L17 7" />
      </>
    ),
    duda: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M9.5 9.5a2.5 2.5 0 015 .4c0 1.6-2.5 2-2.5 3.6" />
        <path d="M12 17h.01" />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('h-7 w-7', className)}
    >
      {trazos[tipo]}
    </svg>
  )
}

function Cabecera(props: {
  tono: Tono
  icono: TipoIcono
  titulo: string
  /** Texto chico sobre el título: dice de qué se trata la pantalla. */
  kicker: string
  badge?: ReactNode
}) {
  const clases = CLASES_TONO[props.tono]

  return (
    <header className="flex items-start gap-4">
      <span
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border',
          clases.caja,
        )}
      >
        <IconoEstado tipo={props.icono} />
      </span>

      <div className="min-w-0">
        <p className="text-xs uppercase tracking-widest text-muted">{props.kicker}</p>
        <h1 className={cn('mt-1 text-2xl sm:text-3xl', clases.texto)}>{props.titulo}</h1>
        {props.badge ? <div className="mt-2">{props.badge}</div> : null}
      </div>
    </header>
  )
}

function Fila({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-xs uppercase tracking-widest text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm text-ink">{children}</dd>
    </div>
  )
}

/** Ficha de la orden. Se repite en los cuatro estados, así que va en un solo lugar. */
function DetalleOrden({ orden }: { orden: Order }) {
  return (
    <dl className="mt-6 divide-y divide-line border-y border-line">
      <Fila label="Orden">
        <span className="tnum">{orden.commerceOrder}</span>
      </Fila>
      <Fila label="Total">
        <span className="tnum text-accent">{formatCLP(orden.total)}</span>
      </Fila>
      {orden.medioPago ? <Fila label="Medio de pago">{orden.medioPago}</Fila> : null}
      <Fila label="A nombre de">{orden.buyer.nombre}</Fila>
      <Fila label="Mail">{orden.buyer.email}</Fila>
      <Fila label="Despacho a">
        {orden.buyer.direccion}, {orden.buyer.comuna}, {orden.buyer.ciudad}
      </Fila>
    </dl>
  )
}

/** Nota al pie: el mail de confirmación es la fuente de verdad para el comprador. */
function NotaSoporte({ commerceOrder }: { commerceOrder: string }) {
  return (
    <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-muted">
      Guardá el número de orden <span className="tnum text-ink">{commerceOrder}</span>: es lo
      primero que te vamos a pedir si escribís por soporte.
      {/* TODO: reemplazar por el mail de contacto real de Scronter. */}
    </p>
  )
}

const TONO_BADGE: Record<OrderStatus, 'ok' | 'warn' | 'danger' | 'neutral'> = {
  pagada: 'ok',
  pendiente: 'warn',
  rechazada: 'danger',
  anulada: 'neutral',
}

/* --------------------------------------------------------------------------
   PÁGINA
   -------------------------------------------------------------------------- */

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  // En Next 15 los searchParams son una Promise: la página es dinámica por
  // definición y hay que esperarlos antes de leerlos.
  const { order } = await searchParams
  const commerceOrder = order?.trim()

  // Caso 1: alguien entró a /confirmacion sin venir de un pago (o Flow no
  // devolvió la query). Nada que mostrar, pero tampoco es un error del usuario.
  if (!commerceOrder) {
    return (
      <Marco>
        <Cabecera
          tono="muted"
          icono="duda"
          kicker="Estado del pago"
          titulo="No encontramos la orden"
        />
        <p className="mt-6 text-sm leading-relaxed text-muted">
          Esta pantalla se abre después de pagar y necesita el número de orden en el link. Si
          llegaste acá desde un mail o un favorito, volvé a la tienda; si ya pagaste, te llega la
          confirmación por mail.
        </p>
        <div className="mt-8">
          <Link href="/tienda" className={CTA_PRIMARIO}>
            Ir a la tienda
          </Link>
        </div>
      </Marco>
    )
  }

  const orden = getOrder(commerceOrder)

  // Caso 2: la orden no está. En desarrollo pasa seguido porque el store vive
  // en memoria y se vacía con cada recompilación o cold start (ver el TODO en
  // lib/orders/store.ts). No lo disfrazamos de error genérico: el comprador
  // necesita saber que el cobro puede haberse hecho igual.
  if (!orden) {
    return (
      <Marco>
        <Cabecera
          tono="warn"
          icono="duda"
          kicker="Estado del pago"
          titulo="No pudimos leer el estado de esta orden"
        />
        <dl className="mt-6 divide-y divide-line border-y border-line">
          <Fila label="Orden">
            <span className="tnum">{commerceOrder}</span>
          </Fila>
        </dl>
        <p className="mt-6 text-sm leading-relaxed text-muted">
          El registro de esta orden no está disponible en este momento.{' '}
          <span className="text-ink">Esto no significa que el pago haya fallado.</span> Si el cobro
          se hizo, lo confirmamos por mail con el detalle de la compra y el despacho.
        </p>
        <NotaSoporte commerceOrder={commerceOrder} />
        <div className="mt-8">
          <Link href="/tienda" className={CTA_FANTASMA}>
            Volver a la tienda
          </Link>
        </div>
      </Marco>
    )
  }

  const badge = <Badge tone={TONO_BADGE[orden.status]}>{orden.status}</Badge>

  switch (orden.status) {
    case 'pagada':
      return (
        <Marco>
          <Cabecera
            tono="ok"
            icono="check"
            kicker="Estado del pago"
            titulo="Pago confirmado"
            badge={badge}
          />
          <p className="mt-6 text-sm leading-relaxed text-muted">
            Listo, recibimos el pago. Gracias por comprar en Scronter.
          </p>

          <DetalleOrden orden={orden} />

          <h2 className="mt-8 text-xs uppercase tracking-widest text-muted">Qué pasa ahora</h2>
          <ol className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
            <li className="border-l border-accent/40 pl-3">
              Te mandamos la confirmación a <span className="text-ink">{orden.buyer.email}</span>{' '}
              con el detalle de la compra.
            </li>
            <li className="border-l border-accent/40 pl-3">
              Preparamos el pedido y lo despachamos a la dirección que dejaste.
              {/* TODO: reemplazar por los plazos reales de despacho una vez definido el courier. */}
            </li>
            <li className="border-l border-accent/40 pl-3">
              Cuando salga, te avisamos por mail con el número de seguimiento.
            </li>
          </ol>

          <NotaSoporte commerceOrder={orden.commerceOrder} />

          <div className="mt-8">
            <Link href="/tienda" className={CTA_PRIMARIO}>
              Seguir comprando
            </Link>
          </div>
        </Marco>
      )

    case 'rechazada':
      return (
        <Marco>
          <Cabecera
            tono="danger"
            icono="cruz"
            kicker="Estado del pago"
            titulo="Pago rechazado"
            badge={badge}
          />
          <p className="mt-6 text-sm leading-relaxed text-muted">
            El pago no se completó y{' '}
            <span className="text-ink">no se hizo ningún cobro a tu cuenta</span>. Puede ser un
            rechazo del banco, un límite de la tarjeta o datos mal ingresados en Flow.
          </p>

          <DetalleOrden orden={orden} />

          <p className="mt-6 text-sm leading-relaxed text-muted">
            Tu carrito sigue guardado en este navegador, así que podés intentar de nuevo — se genera
            una orden nueva, sin duplicar nada.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/checkout" className={CTA_PRIMARIO}>
              Intentar de nuevo
            </Link>
            <Link href="/tienda" className={CTA_FANTASMA}>
              Volver a la tienda
            </Link>
          </div>
        </Marco>
      )

    case 'anulada':
      return (
        <Marco>
          <Cabecera
            tono="muted"
            icono="barra"
            kicker="Estado del pago"
            titulo="Pago anulado o expirado"
            badge={badge}
          />
          <p className="mt-6 text-sm leading-relaxed text-muted">
            La orden se anuló antes de completarse: puede que hayas cerrado el pago o que el plazo
            del cupón haya vencido. No se cobró nada.
          </p>

          <DetalleOrden orden={orden} />

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/tienda" className={CTA_PRIMARIO}>
              Volver a la tienda
            </Link>
            <Link href="/checkout" className={CTA_FANTASMA}>
              Reintentar el pago
            </Link>
          </div>
        </Marco>
      )

    case 'pendiente':
    default:
      // `default` cae en pendiente a propósito: ante un estado que todavía no
      // conocemos, lo seguro es decir "en proceso" y nunca "pagado".
      return (
        <Marco>
          <Cabecera
            tono="warn"
            icono="reloj"
            kicker="Estado del pago"
            titulo="Pago en proceso"
            badge={badge}
          />
          <p className="mt-6 text-sm leading-relaxed text-muted">
            Todavía no tenemos la confirmación de Flow. Es normal: los pagos con{' '}
            <span className="text-ink">transferencia, efectivo en caja o cupón de pago</span> se
            confirman recién cuando el dinero se acredita, y eso puede tardar desde unos minutos
            hasta un día hábil.
          </p>

          <DetalleOrden orden={orden} />

          <p className="mt-6 text-sm leading-relaxed text-muted">
            No hace falta pagar de nuevo. Podés recargar esta página para ver si ya se acreditó, y
            en cuanto se confirme te avisamos a{' '}
            <span className="text-ink">{orden.buyer.email}</span>.
          </p>

          <NotaSoporte commerceOrder={orden.commerceOrder} />

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {/*
              Ancla nativa, NO <Link>: queremos una request nueva al servidor
              para volver a leer el estado. Un <Link> a la misma URL hace
              navegación en el cliente y puede servir la vista que ya está en
              memoria, o sea el botón no haría nada visible.
              Se eligió el botón antes que <meta httpEquiv="refresh">: recargar
              solo la página cada 10 segundos le saca el control al comprador y
              rompe el foco y el scroll mientras está leyendo.
            */}
            <a
              href={`/confirmacion?order=${encodeURIComponent(orden.commerceOrder)}`}
              className={CTA_PRIMARIO}
            >
              Actualizar estado
            </a>
            <Link href="/tienda" className={CTA_FANTASMA}>
              Volver a la tienda
            </Link>
          </div>
        </Marco>
      )
  }
}
