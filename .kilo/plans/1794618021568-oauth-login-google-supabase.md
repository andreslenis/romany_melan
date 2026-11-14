# Carrito, tallas, filtro de precio y etiquetas en admin

> El plan anterior (login Google / callback OAuth) ya está implementado y commiteado en
> `pruebas-romany` (`1d792ef`). Este documento lo reemplaza con el nuevo alcance.

## Contexto

Hallazgos verificados en el código:

1. **Talla:** `src/app/producto/[slug]/page.tsx:100` preselecciona la primera talla
   (`setSelectedSize(String(prod.tallas[0]))`), así que el `<option value="">Seleccionar talla</option>`
   (línea 545) nunca queda seleccionado y siempre se puede agregar al carrito.
2. **Precio del carrito:** `CartItem.precio` se guarda en `localStorage` al agregar
   (`CartContext`), y ese valor es el que alimenta el subtotal, la firma de integridad y el
   `amount-in-cents` de Wompi (`WebCheckoutForm.tsx:55,78,108,143`). Si el admin cambia el precio,
   el carrito sigue cobrando el precio viejo; además el monto es 100% del navegador, sin
   recalculación en servidor (ni el webhook valida el monto contra `pedidos.total_cop`).
3. **Filtro:** `SoberbiaClient.tsx:31-36` y `CollectionClient.tsx:39-44` solo tienen
   `precio-desc` y `alfabetico`.
4. **Admin pedidos:** el modal ya renderiza `item.observaciones` ("Nota: …") y
   `direccion_envio.notas` ("Observaciones" dentro de Dirección de envío), pero las etiquetas no
   distinguen de dónde viene cada texto.
5. **Login 400 (auth/v1/token):** el usuario confirmó que ya quedó resuelto. Fuera de alcance.

## Decisiones

1. **Talla obligatoria solo si el producto tiene tallas.** Si `tallas` está vacío, se puede agregar
   sin talla. Texto del placeholder: "Seleccione talla". Botón deshabilitado + ayuda
   "Selecciona una talla para continuar".
2. **Precio con dos capas:** el carrito refresca precios desde Supabase (para que se vean
   actualizados) y el servidor revalida y recalcula todo al crear el pedido y firmar el pago.
   El monto que se cobra y la firma salen del servidor, no del navegador.
3. **Filtros de precio por precio efectivo** (promoción si está activa; si no, `precio_cop`), no por
   precio regular, para que el orden coincida con lo que se muestra en la tarjeta.
4. **admin/pedidos:** mismo modal, con secciones separadas y etiquetadas para las notas de pieza y
   las del checkout.

## Tareas

### 1. Talla obligatoria en la PDP

`src/app/producto/[slug]/page.tsx`

- En el `useEffect` de carga (línea ~100) quitar la preselección: `setSelectedSize(null)`.
- Añadir un efecto que resetee `selectedSize` a `null` cuando cambie `slugActivo` (cambiar de color
  cambia de variante y de tallas).
- Cambiar el texto del `<option value="">` a "Seleccione talla".
- `requiereTalla = Array.isArray(producto.tallas) && producto.tallas.length > 0`;
  `puedeAgregar = !requiereTalla || Boolean(selectedSize)`.
- `handleAddToCart`: `if (!puedeAgregar) return;` al inicio.
- Botón "Tejer esta Historia en mi Piel" (las dos apariciones, líneas ~570 y ~581):
  `disabled={!puedeAgregar}` y, debajo, `{requiereTalla && !selectedSize && <p className="pdp-size-hint">Selecciona una talla para continuar.</p>}`.
- CSS en `src/app/globals.css`: `.pdp-size-hint` (texto pequeño, `color: rgba(17,17,17,0.55)`,
  `margin-top: 0.5rem`) y `.pdp-add-btn:disabled` (opacidad 0.55, `cursor: not-allowed`).

### 2. Precio autoritativo en servidor (helper compartido)

**`src/lib/pricing-server.ts` (nuevo)**

```ts
export type LineaCarrito = { slug: string; cantidad: number; talla?: string | null; colorHilo?: string | null };
export type ItemConPrecio = LineaCarrito & { nombre: string; precio: number };
export type ResultadoPrecio =
  | { ok: true; items: ItemConPrecio[]; total: number; amountInCents: number }
  | { ok: false; error: "producto_no_disponible"; slug: string };
```

- Recibe líneas con `slug` + `cantidad`, consulta `productos` por `slug` (una sola query con `.in()`)
  usando `supabaseAdmin` y filtra `activo` (si la columna existe; si es `false`, error).
- Calcula el precio con `precioFinal({ precio: precio_cop, precioPromo, promoActiva })` de
  `@/utils/precio` (módulo puro).
- Devuelve `total` (suma `precio * cantidad`) y `amountInCents = Math.round(total * 100)`.
- No usa `formatCOP` ni nada dependiente del navegador.

**`src/lib/wompi/integrity.ts` (nuevo)**

- `firmarIntegridad({ reference, amountInCents, currency, secret })` con el mismo
  `sha256(reference + amountInCents + currency + secret)` que hoy vive en
  `src/app/api/wompi/integrity/route.ts:20`.

### 3. Endpoints

**`POST /api/checkout/pedido`** (`src/app/api/checkout/pedido/route.ts`)

- Recibe `{ numero_pedido, items, datos }`. Ignorar `total_cop` del cliente.
- `resolverPrecios(items)` → si `!ok`, responder 409 `{ error, slug }`.
- Reescribir cada item con el `precio` del servidor (mantener `nombre`, `talla`, `colorHilo`,
  `colorHiloHex`, `observaciones`, `linea`, `cantidad`, `coleccion`).
- Insertar/actualizar el pedido con `total_cop = total` del servidor (la rama de "ya existe"
  también recalcula, para que un reintento no conserve el total viejo).
- Firmar con `firmarIntegridad` y responder
  `{ ok: true, pedido, total, amountInCents, signature }`.

**`POST /api/cart/pricing` (nuevo)**

- Recibe `{ slugs: string[] }` y responde `{ ok: true, precios: { [slug]: { nombre, precio, activo } } }`.
- Solo expone datos públicos del catálogo.

**`POST /api/wompi/integrity`**

- Refactor para usar `firmarIntegridad` (misma respuesta). Sin cambio de contrato; se mantiene por
  el endpoint de depuración.

### 4. Refresco de precios en el carrito

`src/context/CartContext.tsx`

- Nuevo método `syncPrices(): Promise<{ slug: string; antes: number; ahora: number }[]>`:
  agrupa los `slug` de `itemsRef.current`, llama a `/api/cart/pricing`, y si algún precio cambió
  actualiza `items` (persist) y devuelve los cambios.
- Efecto que corre `syncPrices()` cuando cambia la clave de slugs (ordenada) y `hydrated` es true.
  Evitar bucles: el efecto depende de la clave de slugs, no de `items`.
- Exponer `cambiosPrecio` (últimos cambios) y `descartarCambiosPrecio()` en el contexto y en
  `useMemo` de dependencias.

`src/components/cart/CartDrawer.tsx`

- Al abrir (`isOpen`), si `cambiosPrecio.length > 0`, mostrar un aviso
  ` Se actualizó el precio de: <nombre> (antes $X → ahora $Y)` con botón "Entendido" que llama a
  `descartarCambiosPrecio()`. Reutilizar clases existentes (`cart-note`) + una nueva
  `.cart-price-notice`.

### 5. Checkout con monto del servidor

`src/components/checkout/WebCheckoutForm.tsx`

- Eliminar el `fetch("/api/wompi/integrity")` del `useEffect` y el estado `signature` inicial.
- En `handleSubmit`: `POST /api/checkout/pedido` con `{ numero_pedido, items, datos }`; usar
  `amountInCents` y `signature` de la respuesta para armar la URL de Wompi.
- Si la respuesta es 409 `producto_no_disponible`, mostrar el mensaje
  ("La pieza <nombre> ya no está disponible. Revisa tu carrito.") en el bloque de pago.
- `loading` pasa a significar "enviando"; el botón muestra "Procesando…" y queda deshabilitado para
  evitar doble envío.

`src/app/checkout/page.tsx`

- El `subtotal` mostrado ya viene del carrito sincronizado; no cambia el contrato.
- Si `items` trae precios viejos en el primer render, el efecto de `syncPrices` los corrige antes de
  que el usuario llegue al paso 2.

### 6. Filtro precio ascendente

`src/app/coleccion/soberbia/SoberbiaClient.tsx` y `src/app/coleccion/[slug]/CollectionClient.tsx`

- `type OrdenCatalogo = "destacado" | "precio-asc" | "precio-desc" | "alfabetico"`.
- Añadir `{ id: "precio-asc", label: "Precio: menor a mayor" }` como primer botón.
- Ordenar por precio efectivo: `precioFinal({ precio: p.precio_cop, precioPromo: p.precio_promo, promoActiva: p.promo_activa })`
  (importar de `@/utils/precio`), desempatando por `nombre.localeCompare("es")`. Aplicar a
  `precio-desc` y `precio-asc`.

### 7. Etiquetas claras en admin/pedidos

`src/app/admin/pedidos/page.tsx`

- En "Ficha de confección", por ítem: `Observaciones de la pieza` (con el texto o "Sin
  observaciones"), además de `Talla`, `Color de hilo`, `Línea` y `Cantidad` (hoy no se muestra la
  cantidad ni el precio unitario).
- Mover las notas del checkout fuera de `DireccionEnvioView` a una sección propia
  **"Observaciones del checkout"** (o `DireccionEnvioView` recibe `mostrarNotas={false}` y el modal
  renderiza el bloque aparte), con `whiteSpace: "pre-wrap"` y comillas; si no hay texto, "Sin
  observaciones".

## Validación

1. `npx tsc --noEmit`, `npm run lint`, `npm run build`.
2. Manual local (`npm run dev`):
   - PDP con tallas: el select inicia en "Seleccione talla", el botón está deshabilitado y aparece
     la ayuda; al elegir talla se habilita y agrega.
   - PDP sin tallas: agrega sin restricción.
   - Cambiar color de variante con tallas distintas: la talla elegida se reinicia.
   - Cambiar `precio_cop` o `precio_promo` de una pieza en `/admin/productos`, recargar la tienda y
     abrir el carrito: el precio del carrito se actualiza y aparece el aviso de cambio.
   - Checkout: el `amount-in-cents` de la URL de Wompi coincide con `pedidos.total_cop` y con el
     subtotal mostrado.
   - Filtros: "Precio: menor a mayor" y "mayor a menor" ordenan por precio efectivo; "Restablecer"
     vuelve al orden por defecto.
   - admin/pedidos: el modal muestra "Observaciones de la pieza" y "Observaciones del checkout".
3. Repetir el flujo de pago en TEST de Wompi de punta a punta (aprobado) y verificar que el pedido
   queda con el total correcto.

## Riesgos y notas

- `WOMPI_INTEGRITY_SECRET` debe existir; si falta, el checkout falla con mensaje de configuración
  (igual que hoy).
- Carritos viejos en `localStorage` con precios desactualizados se corrigen solos al cargar.
- `pedidos.items` guarda el precio del momento de la compra (histórico), no se reescribe después.
- No se valida stock en checkout: fuera de alcance.
- `POST /api/cart/pricing` es público, pero solo devuelve nombre/precio/activo del catálogo.
- El 400 de `signInWithPassword` queda fuera de alcance por indicación del usuario. Conviene dejar
  anotado que `ProfileContext.signInWithEmail` (`src/context/ProfileContext.tsx:225-231`) sigue
  tragándose el error: si el 400 reaparece, no se verá en pantalla.