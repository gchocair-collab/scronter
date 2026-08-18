# SCRONTER — Tienda online

## 1. Qué es

Base de tienda online para **Scronter**, marca chilena de ropa y accesorios de skate.
Está hecha con Next.js 15 (App Router), React 19, TypeScript en modo strict, Tailwind 3.4
y Zustand 5. Incluye catálogo con las cinco categorías (tablas, gorros, polerones, poleras,
zapatillas), fichas de producto con selector de talla/medida y stock por variante, carrito
persistido en `localStorage`, checkout con datos de despacho y la integración completa con
**Flow** (creación del pago, webhook de confirmación y página de retorno).
**No incluye** base de datos —las órdenes viven en memoria, ver la sección 10— ni panel de
administración, ni gestión de despachos, ni mails transaccionales, ni fotos reales de producto
(todo se dibuja con el componente `<Placeholder>`). Es la base sobre la que se construye, no
una tienda lista para cobrar plata de verdad.

---

## 2. Requisitos

| Requisito | Mínimo | En esta máquina |
| --- | --- | --- |
| Node.js | 18+ | v24.19.0 |
| npm | 9+ | 11.17.0 |
| Cuenta de Flow | sandbox para probar | — |

No hace falta base de datos, Docker ni nada más.

---

## 3. Cómo correrlo

```powershell
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

Abre en **http://localhost:3000**.

`.env.local` está en `.gitignore` y nunca se commitea. El sitio levanta y se navega
completo sin credenciales de Flow: lo único que falla es el botón de pagar, que va a tirar
`Falta la variable de entorno FLOW_API_KEY`. Para eso está la sección siguiente.

Otros scripts:

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Build de producción |
| `npm start` | Sirve el build (requiere `npm run build` antes) |
| `npm run lint` | ESLint de Next |
| `npm run typecheck` | `tsc --noEmit`, sin emitir archivos |

---

## 4. Configurar Flow

Paso a paso, sin saltarse ninguno:

1. Registrate en **https://sandbox.flow.cl** (sandbox y producción son cuentas distintas).
2. Entrá a **"Mis datos"** → pestaña **"Integraciones"**.
3. Ahí están el **API Key** y el **Secret Key**. Copiá los dos.
4. Pegalos en tu `.env.local`:

   ```env
   FLOW_API_KEY=tu-api-key-de-sandbox
   FLOW_SECRET_KEY=tu-secret-key-de-sandbox
   FLOW_ENV=sandbox
   ```

5. Dejá `FLOW_ENV=sandbox` hasta que hayas probado el flujo completo de punta a punta.
6. Reiniciá `npm run dev` — Next lee las variables de entorno al arrancar, no en caliente.

### Las variables

| Variable | Para qué sirve | Ejemplo |
| --- | --- | --- |
| `FLOW_API_KEY` | Identifica tu comercio ante Flow. Viaja dentro de los parámetros firmados de cada request. | `1F8A...` |
| `FLOW_SECRET_KEY` | Llave con la que se calcula la firma HMAC-SHA256 de cada request (parámetro `s`). Es la contraseña de tu comercio. | `9c3b...` |
| `FLOW_ENV` | `sandbox` apunta a `https://sandbox.flow.cl/api`, `production` a `https://www.flow.cl/api`. | `sandbox` |
| `NEXT_PUBLIC_SITE_URL` | URL pública desde la que se arman `urlConfirmation` (el webhook) y `urlReturn` (a dónde vuelve el comprador). | `http://localhost:3000` |

> **Ninguna de las tres variables de Flow lleva el prefijo `NEXT_PUBLIC_`, y no es un
> descuido.** Ese prefijo hace que Next incruste el valor en el bundle del navegador, o sea
> que quedaría a la vista de cualquiera que abra devtools. Con el `FLOW_SECRET_KEY` en el
> cliente, un tercero puede firmar pagos en tu nombre. `src/lib/flow/client.ts` es
> **solo servidor** y vive detrás de las rutas de `src/app/api/flow/*`; si alguna vez ves
> `FLOW_SECRET_KEY is not defined` en la consola del browser, significa que ese módulo se
> coló en un componente cliente: es un bug de seguridad, no de configuración.
>
> `NEXT_PUBLIC_SITE_URL` sí lleva el prefijo porque es una URL pública, no un secreto.

Si Flow responde **401 "apiKey not found"**, casi siempre es una key de sandbox usada contra
producción (o al revés). Si responde **"Invalid signature"**, revisá que estés firmando con el
Secret Key —no con el API Key— y que el `apiKey` esté incluido dentro de lo que se firma.

---

## 5. ⚠️ Probar el webhook localmente

**Esta es la sección que viniste a buscar a las 2 de la mañana.**

### El problema

Flow confirma los pagos haciendo un **POST desde internet** a la URL que le pasás como
`urlConfirmation`. Si esa URL es `http://localhost:3000/api/flow/confirmation`, el POST sale
de los servidores de Flow y muere: `localhost` para Flow es *su propio* localhost, no tu
notebook. Nunca llega nada.

Lo peor es cómo se ve el síntoma: **el pago se cobra correctamente**, el comprador vuelve a la
página de confirmación, pero la orden queda en `pendiente` para siempre porque nadie llamó a
`markOrderStatus`. Parece un bug del código y no lo es: el webhook nunca fue entregado.

### La solución: un túnel

Con `npm run dev` corriendo, abrí **otra** terminal y levantá un túnel:

```powershell
npx cloudflared tunnel --url http://localhost:3000
```

Te va a imprimir una URL pública, algo así:

```
https://algo-random-cualquiera.trycloudflare.com
```

Pegala en `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://algo-random-cualquiera.trycloudflare.com
```

Y **reiniciá `npm run dev`** (Ctrl+C y de nuevo). Sin reiniciar, Next sigue usando el valor
viejo y el problema no se mueve.

### Cosas que conviene saber

- La URL del túnel **cambia cada vez** que lo levantás. Cada vez que reinicias el túnel hay
  que actualizar `NEXT_PUBLIC_SITE_URL` y reiniciar el dev server. Sí, es tedioso; es el
  precio de no tener un dominio.
- Dejá el túnel **abierto** durante toda la prueba. Si lo cerrás entre el redirect a Flow y
  la confirmación, el webhook cae en el vacío.
- Navegá el sitio **por la URL del túnel**, no por `localhost`, así el flujo completo usa el
  mismo origen.
- El webhook de Flow tiene **~15 segundos** para responder 200. Si tarda más, Flow lo
  considera fallido.
- ¿Quedó una orden pagada pero marcada `pendiente`? Se puede reconciliar a mano con
  `getStatusByCommerceOrder(commerceOrder)` de `src/lib/flow/client.ts`, que le pregunta a
  Flow por *nuestro* ID de orden en vez del token.
- El webhook **siempre verifica contra Flow** (`getPaymentStatus`) antes de marcar la orden.
  El POST solo trae un token, no una prueba de pago: confiar en el POST sin verificar dejaría
  que cualquiera dispare una confirmación falsa.

---

## 6. Tarjetas de prueba (Flow sandbox)

| Resultado | Número | CVV | Vencimiento |
| --- | --- | --- | --- |
| **Aprobada** | `4051 8856 0044 6623` | `123` | cualquier fecha futura |
| **Rechazada** | `5186 0595 5959 0568` | `123` | cualquier fecha futura |

Probá las dos: el camino de rechazo es el que se rompe en producción por falta de pruebas.
Recordá que Flow exige un monto mínimo de **350 CLP** y montos enteros (el CLP no tiene
centavos).

---

## 7. Cambiar colores y tipografía

Son **dos archivos** y nada más. Ningún componente escribe un color literal —no hay
`bg-black`, ni `text-white`, ni `bg-[#C6FF00]` en ninguna parte—, así que no hay que buscar y
reemplazar en 20 archivos.

### Colores → `src/styles/tokens.css`

Todos los colores son variables CSS. Cambiar **`--accent`** cambia el sitio entero: botones,
links, precios destacados, badges, hovers, anillos de foco.

Alternativas de acento que ya están comentadas en el archivo y funcionan sobre el fondo negro:

| Acento | Valor (`--accent`) | Hex |
| --- | --- | --- |
| Verde flúor (actual) | `198 255 0` | `#C6FF00` |
| Amarillo flúor | `255 234 0` | `#FFEA00` |
| Naranja flúor | `255 106 0` | `#FF6A00` |
| Cyan eléctrico | `0 229 255` | `#00E5FF` |
| Magenta | `255 0 122` | `#FF007A` |

Detalles que importan:

- Los colores se guardan como **canales sueltos** (`198 255 0`, no `#C6FF00`). Es lo que
  permite que sigan funcionando las variantes de opacidad tipo `bg-accent/10`. Si pones un hex
  plano en la variable, todas las clases con barra se rompen en silencio.
- Si cambiás `--accent`, ajustá también **`--accent-hover`** (una versión un poco más clara) y
  revisá **`--accent-ink`**, que es el color del texto *encima* del acento. Con acentos claros
  y saturados va negro; si elegís un acento oscuro, ponelo en `var(--ink)` o los botones quedan
  ilegibles.
- Los tres semánticos (`--ok`, `--warn`, `--danger`) están **deliberadamente separados** del
  acento y se quedan quietos. Si el acento también significara "éxito", cambiar la marca a rojo
  haría que un pago aprobado se viera como un error.
- **Cuidado al elegir un acento del mismo tono que un semántico.** Probando el cambio a naranja
  flúor (`255 106 0`) apareció esto: el badge "Últimas unidades" usa `--warn`, que es un ámbar
  (`255 176 32`), y con el acento naranja los dos quedaron casi indistinguibles —el subrayado del
  filtro activo y una alerta de stock se veían igual. La separación de tokens evita que un cambio
  de marca rompa el *significado*, pero no evita que dos tonos parecidos se confundan a la vista.
  Si te vas a naranja o amarillo, corré también `--warn` hacia otro lado (por ejemplo un ámbar
  más oscuro, `217 119 6`) o cambiá el badge a `neutral`.
- Los radios (`--radius-sm`, `--radius`, `--radius-lg`) también están ahí. Están chicos porque
  la estética skate es angulosa; ponelos en `0` para un look brutalista.
- `tailwind.config.ts` solo **mapea** esos tokens a nombres de clase. Solo se toca si querés
  **agregar** un token nuevo (por ejemplo un segundo acento).

### Tipografía → `src/lib/fonts.ts`

Dos roles, y los componentes solo conocen los roles, nunca el nombre de la fuente:

| Clase | Rol | Fuente actual |
| --- | --- | --- |
| `font-display` | Títulos, precios grandes, el logotipo | Anton |
| `font-body` | Párrafos, labels, inputs | Barlow |

Para cambiarlas: editás el `import` de `next/font/google` en ese archivo y ajustás los `weight`
que la familia realmente tenga. Si pedís un peso que no existe, el build falla —es un error
útil, no silencioso—. No hay que tocar `tailwind.config.ts` ni ningún componente.
Alternativas sugeridas ya están comentadas ahí mismo (Bebas Neue, Oswald, Archivo Black, Teko
para display; DM Sans, Work Sans, IBM Plex Sans para body).

---

## 8. Reemplazar los placeholders

👉 **Para las fotos hay una guía aparte, paso a paso: [IMAGENES.md](IMAGENES.md).**

Resumen: el código ya soporta fotos reales. `<Placeholder>`
(`src/components/ui/Placeholder.tsx`) muestra la imagen cuando existe y dibuja un bloque con el
nombre cuando todavía no. Todos los productos arrancan en `imagen: null`, y se van llenando de
a uno — no hace falta tener las 16 fotos para ver la primera funcionando.

Lo que NO son fotos y también hay que reemplazar:

| Qué | Dónde | Nota |
| --- | --- | --- |
| Logotipo | `src/components/layout/Header.tsx` | Hoy es el texto `SCRONTER` en `font-display`. Reemplazar por el SVG en `/public/logo.svg`. |
| Redes sociales | `src/components/layout/Footer.tsx` | Los `href="#"` son placeholders; poner Instagram, TikTok, etc. |
| Datos de contacto | `src/components/layout/Footer.tsx` | Correo, WhatsApp y dirección son ficticios y están marcados con TODO. |
| Imagen de Open Graph | `src/app/layout.tsx` (`metadata.openGraph`) | 1200×630 px. Sin esto, compartir el link en WhatsApp/Instagram no muestra imagen. |
| Favicon | `src/app/favicon.ico` | — |

Buscá `TODO:` en el proyecto y te salen todos los puntos a reemplazar.

**Si las fotos van a un CDN** (Cloudinary, un CMS) en vez de a `/public`, hay que declarar su
host en `next.config.ts` → `images.remotePatterns`, o `next/image` las rechaza. El bloque está
comentado ahí mismo.

---

## 9. Estructura de carpetas

```
scronter/
├── public/
│   └── images/                    # Assets estáticos. Hoy vacío: TODO subir fotos
├── src/
│   ├── app/                       # App Router: cada carpeta es una ruta
│   │   ├── layout.tsx             # Shell raíz: fuentes, metadata, Header y Footer
│   │   ├── globals.css            # Importa tokens.css + Tailwind + estilos base (.shell, .tnum)
│   │   ├── page.tsx               # Home: hero, destacados, categorías
│   │   ├── tienda/                # Catálogo con filtro por categoría (?categoria=X)
│   │   │   └── [slug]/            # Ficha de producto: variantes, cantidad, agregar al carrito
│   │   ├── carrito/               # Carrito: líneas, cantidades, subtotal
│   │   ├── checkout/              # Formulario de datos del comprador y despacho
│   │   ├── confirmacion/          # Página de retorno de Flow (urlReturn)
│   │   └── api/flow/
│   │       ├── create-payment/    # Crea la orden y el pago en Flow, devuelve el redirect
│   │       ├── confirmation/      # ⚠️ WEBHOOK (urlConfirmation). Verifica y marca la orden
│   │       └── status/            # Consulta el estado de una orden para la confirmación
│   ├── components/
│   │   ├── ui/                    # Piezas genéricas: Button, Badge, Placeholder
│   │   ├── layout/                # Header, Footer, CartBadge
│   │   ├── product/               # ProductCard, ProductGrid, CategoryFilter, VariantSelector, QuantityStepper
│   │   ├── cart/                  # CartItem, CartSummary
│   │   └── checkout/              # CheckoutForm
│   ├── data/
│   │   └── products.ts            # Catálogo hardcodeado + helpers de consulta (getProductBySlug, etc.)
│   ├── lib/
│   │   ├── flow/                  # Cliente de Flow: firma HMAC, create/getStatus. SOLO SERVIDOR
│   │   ├── orders/                # Persistencia de órdenes y cálculo del total en servidor
│   │   ├── format.ts              # formatCLP() y cn()
│   │   └── fonts.ts               # 👈 Las dos fuentes. Único archivo de tipografía
│   ├── store/
│   │   └── cart.ts                # Store de Zustand del carrito, persistido en localStorage
│   ├── styles/
│   │   └── tokens.css             # 👈 Todos los colores. Único archivo de color
│   └── types/
│       └── index.ts               # Contrato de tipos: Product, CartLine, Order, etc.
├── .env.local.example             # Plantilla de variables. Copiar a .env.local
├── tailwind.config.ts             # Mapea los tokens a clases. Casi nunca se toca
└── next.config.ts                 # Config de Next. TODO: hosts de imágenes remotas
```

---

## 10. ⚠️ Antes de producción

Lista honesta de lo que falta. Nada de esto es opcional si vas a cobrar plata real.

### 10.1 Las órdenes viven en un `Map` en memoria — hay que poner una DB

`src/lib/orders/store.ts` guarda las órdenes en un `Map`. Sirve para desarrollo local y nada
más. En serverless (Vercel, Netlify) se rompe, y de una forma que **no es obvia**: cada
invocación puede levantar una instancia distinta del proceso. El checkout crea la orden en la
instancia A, y minutos después el webhook de Flow aterriza en la instancia B, que tiene un
`Map` vacío — así que la orden "no existe" y el pago queda sin registrar. Un reinicio del
servidor o un cold start producen el mismo resultado.

La interfaz está pensada para que el reemplazo sea barato: cambiás **solo los cuerpos** de
`createOrder`, `getOrder`, `attachFlowToken` y `markOrderStatus`, y ni el checkout ni el
webhook se enteran.

Opciones que encajan bien con Next: Supabase (Postgres gestionado, tiene tier gratis),
Vercel Postgres / Neon, o Prisma sobre cualquier Postgres.

Esquema mínimo equivalente a lo que hoy hace ese archivo:

```sql
create table orders (
  commerce_order text primary key,
  lines          jsonb not null,
  total          integer not null,
  buyer          jsonb not null,
  status         text not null default 'pendiente',
  flow_token     text,
  flow_order     integer,
  medio_pago     text,
  created_at     timestamptz not null default now(),
  paid_at        timestamptz
);
```

### 10.2 El resto

| Falta | Detalle |
| --- | --- |
| **Descontar stock al pagar** | Hoy el stock es un número en `src/data/products.ts` y nadie lo baja cuando se aprueba un pago. Dos personas pueden comprar la última talla M. Va junto con la DB, dentro de `markOrderStatus`. |
| **Mail de confirmación** | No se manda nada. Ni al comprador ni a ustedes. Va en el webhook, pero **encolado**: Flow espera un 200 en ~15 segundos y mandar mails inline puede tardar más. |
| **Panel de administración** | No existe. No hay forma de ver órdenes, cambiar estados ni gestionar el catálogo sin editar código. |
| **Gestión de despachos** | No hay cálculo de costo de envío (el checkout dice que se calcula después), ni integración con courier, ni número de seguimiento. |
| **Credenciales de producción** | `FLOW_ENV=production` **y** las keys de producción, que son **distintas** a las de sandbox y se sacan en https://www.flow.cl → "Mis datos" → "Integraciones". Usar keys de sandbox contra producción devuelve 401. |
| **`NEXT_PUBLIC_SITE_URL` real** | Tiene que apuntar al dominio de verdad (`https://scronter.cl`), con **https** y sin slash final. Si queda con la URL de un túnel de cloudflared o con `localhost`, los webhooks de producción se pierden y las órdenes quedan pendientes para siempre. |

### 10.3 Checklist rápido de despliegue

- [ ] Base de datos real conectada y `src/lib/orders/store.ts` reescrito contra ella.
- [ ] `FLOW_ENV=production` con las credenciales de producción cargadas en el hosting (no en un archivo commiteado).
- [ ] `NEXT_PUBLIC_SITE_URL` = dominio real con https.
- [ ] Webhook probado en producción con un cobro real chico y verificado que la orden pasa a `pagada`.
- [ ] Probado también el camino de **rechazo**.
- [ ] `npm run build` y `npm run typecheck` sin errores.
- [ ] Fotos, logo, datos de contacto y Open Graph reemplazados (sección 8).
