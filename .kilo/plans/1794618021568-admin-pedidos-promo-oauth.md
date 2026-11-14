# Plan: Pedidos (borrado/estados/dirección), Promos, Orden de catálogo y OAuth

## Contexto

Seis cambios en una app Next.js 15 (App Router, React 19) sobre Supabase (Postgres + Auth) y Wompi:

1. Borrar pedidos desde `/admin/pedidos` (solo admin).
2. Mostrar dirección completa y observaciones en el modal del pedido.
3. Cuarto estado de envío `CANCELADO`.
4. Color de fondo según estado de envío (legible, no decorativo).
5. Precio de promoción opcional en `/admin/productos` (con toggle), visible en cliente (tachado + promo) y usado como monto cobrado en Wompi.
6. Botones de orden (precio desc / alfabético) en las páginas de catálogo.
7. Conectar inicio de sesión con Google y Apple.

### Hallazgos de código que condicionan el plan

- `src/app/api/admin/pedidos/route.ts:23` — allowlist de estados solo `EN_PREPARACION|ENVIADO|ENTREGADO`. El enum `estado_envio_enum` en `supabase/schema.sql:43` tampoco incluye `CANCELADO`. **La migración es obligatoria o el PATCH fallará** (Postgres rechaza el valor).
- `src/app/api/admin/pedidos/route.ts:12` — el GET ya devuelve `direccion_envio` e `items`; el problema es que el tipo local de `admin/pedidos/page.tsx` no los declara y el modal no los pinta.
- `src/app/api/checkout/pedido/route.ts:59-77` — el upsert por `numero_pedido` **sobrescribe** `estado_pago`, `estado_envio`, `guia_rastreo`, `transportadora` y `post_pago_procesado_at`. Un reintento del checkout puede revertir el trabajo del admin y duplicar efectos de postpago. Riesgo preexistente, agravado por el borrado.
- `src/lib/wompi/postpago.ts` — `descontarStock` y `upsertCrmCliente` existen y son la referencia para revertir stock y para limpiar el `perfiles` espejo.
- `src/app/coleccion/soberbia/SoberbiaClient.tsx` y `src/app/coleccion/[slug]/CollectionClient.tsx` — obtienen `*` de `productos`, filtran por línea en cliente y renderizan precio con `producto.precio_cop`. No hay estado de orden.
- `src/app/producto/[slug]/page.tsx:274-295` — `handleAddToCart` calcula `precio` desde `precio_cop`; es el único punto donde nace el valor que viaja al checkout y a Wompi.
- `src/context/ProfileContext.tsx:194-218` — `signInWithGoogle` / `signInWithApple` ya existen pero: redirigen a `window.location.origin` (raíz), tragan errores con `console.error` y no limpian el `perfil` local previo. `onAuthStateChange` ya sincroniza sesión → `perfil`.
- **No existe** `src/app/auth/callback/route.ts` (verificado con glob), por lo que el `code` de OAuth nunca se canjea.

---

## Decisiones confirmadas

| Tema | Decisión |
|---|---|
| Promo | Selector + precio, con toggle `promo_activa` (permite desactivar sin borrar) |
| Borrar pedido | Eliminar la fila **y revertir stock** |
| Callback OAuth | Crear `/auth/callback` que canjea `code`, persiste perfil y redirige a `/mi-perfil` |
| Color de estado | Selector de la tabla + modal (clases dedicadas en `globals.css`, no estilos inline) |
| Orden | Ambas páginas de catálogo, con fallback estable para Singular |

---

## Tarea 1 — Migración SQL (base para todo lo demás)

**Archivo:** `supabase/migrations/20261114000000_pedidos_cancelado_productos_promo.sql`

```sql
ALTER TYPE estado_envio_enum ADD VALUE IF NOT EXISTS 'CANCELADO';

ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS precio_promo numeric,
  ADD COLUMN IF NOT EXISTS promo_activa boolean DEFAULT false;

ALTER TABLE public.productos
  ADD CONSTRAINT precio_promo_check CHECK (precio_promo IS NULL OR precio_promo > 0);

CREATE INDEX IF NOT EXISTS idx_pedidos_numero_pedido ON public.pedidos (numero_pedido);
```

Notas:
- `ADD VALUE IF NOT EXISTS` en `ALTER TYPE` no corre dentro de transacción; el archivo va **fuera** de bloque `BEGIN/COMMIT` (igual que `20261105193400_wompi_postpago.sql:4`).
- La constraint `precio_promo_check` es condicional: si se valida en app que `precio_promo < precio_cop`, no forzar en DB para no bloquear migraciones futuras; documentar la validación en el paso 2.

---

## Tarea 2 — `/admin/pedidos`: borrado

**Archivo:** `src/app/api/admin/pedidos/route.ts`

Añadir `export async function DELETE(req: Request)`:
1. `const auth = await requireAdmin(req); if (!auth.ok) return auth.response;`
2. Leer `id` del body (o `searchParams`); `404` con `{ error: "not_found" }` si falta.
3. Buscar la fila por `id` con `select("id, items, estado_pago, post_pago_procesado_at")` (necesario para decidir reversión de stock).
4. **Revertir stock solo si `post_pago_procesado_at` no es nulo** (es la marca atómica de que el postpago ya descontó). Recorrer `items` y por cada `{slug, cantidad}`:
   ```ts
   const { data: prod } = await supabaseAdmin.from("productos").select("id, stock_disponible").eq("slug", slug).maybeSingle();
   if (prod) await supabaseAdmin.from("productos").update({ stock_disponible: (prod.stock_disponible ?? 0) + cantidad }).eq("id", prod.id);
   ```
   Es el inverso exacto de `src/lib/wompi/postpago.ts:27-56`. No revertir si `cantidad <= 0` ni si el slug no existe (log y continuar).
5. Borrar la fila: `.delete().eq("id", id)`. Si `error` → `500 { error: "db_error", detail }`.
6. Opcional pero recomendado: si `cliente_email` existe, **no** borrar el `perfiles` espejo (es un cliente, no un pedido); dejar constancia en el comentario del código.

**Archivo:** `src/app/admin/pedidos/page.tsx`

- Añadir `eliminando` (id en borrado) y `confirmDelete` (bool) al estado.
- En cada fila, botón `Eliminar` (`type="button"`, `style={{ color: "#b3261e" }}`) que abre un `confirm()` o un diálogo inline: "¿Eliminar el pedido X? Esta acción devuelve el stock y no se puede deshacer."
- Función `eliminarPedido(p)`: `DELETE /api/admin/pedidos` con `authHeaders()` + `{ id }`; en éxito, `load()`; en error, `setError(...)`.
- Ocultar/deshabilitar el botón mientras `eliminando === p.id` y mostrar "Eliminando…".

---

## Tarea 3 — `/admin/pedidos`: modal con dirección y observaciones

**Archivo:** `src/app/admin/pedidos/page.tsx`

1. Ampliar el tipo `Pedido` con:
   ```ts
   direccion_envio?: {
     nombre?: string; email?: string; telefono?: string;
     direccion?: string; barrio?: string; ciudad?: string;
     departamento?: string; codigoPostal?: string; notas?: string;
   } | null;
   ```
2. En el modal, después de `<h2>Pedido …</h2>` y antes de "Ficha de confección", insertar una sección `Envío` (reutilizar clases existentes; no crear diseño nuevo):
   - Nombre · Email · Teléfono
   - Dirección (línea completa), Barrio
   - Ciudad, Departamento (dos columnas o ` · `)
   - Código postal
   - Observaciones: bloque aparte con `whiteSpace: "pre-wrap"` y comillas tipográficas, igual que `mi-perfil/page.tsx:412-417`.
3. Usar un helper `DireccionEnvioView({ datos }: { datos: Pedido["direccion_envio"] })` dentro del mismo archivo. Si `datos` es `null`/vacío, mostrar "Sin dirección registrada." (evita `undefined` en pantalla).
4. Los `items` ya se pintan en el modal; añadir `observaciones` por ítem si no está (ya existe en la línea 178) y mostrar `colorHilo` con fallback a `colorHiloHex`.

---

## Tarea 4 — Cuarto estado `CANCELADO` + color

**Archivo:** `src/app/api/admin/pedidos/route.ts`

- Cambiar la allowlist a `new Set(["EN_PREPARACION", "ENVIADO", "ENTREGADO", "CANCELADO"])`.

**Archivo:** `src/app/admin/pedidos/page.tsx`

- Añadir `<option value="CANCELADO">Cancelado</option>` al `<select>`.
- Crear un mapa de clases en el mismo archivo (o en `src/lib/estados-envio.ts` si se reutiliza):
  ```ts
  const CLASE_ESTADO: Record<string, string> = {
    EN_PREPARACION: "estado-envio--preparacion",
    ENVIADO: "estado-envio--enviado",
    ENTREGADO: "estado-envio--entregado",
    CANCELADO: "estado-envio--cancelado",
  };
  ```
- Aplicar la clase al `<select>` (`className={`form-input ${CLASE_ESTADO[p.estado_envio ?? "EN_PREPARACION"]}`}`) y al `<select>` del modal.
- Al cambiar a `CANCELADO`, si `p.estado_pago === "APROBADO"` mostrar un aviso en el modal: "Cancelado no revierte el pago ni el stock". **No** revertir stock aquí; el borrado (Tarea 2) es la vía de reversión.

**Archivo:** `src/app/globals.css` (antes de la línea 3199, junto a `.admin-form-save`)

```css
.estado-envio--preparacion { background-color: #fff1e0; color: #7a4200; border-color: #f0c48a; }
.estado-envio--enviado     { background-color: #e3f0ff; color: #0b3f7a; border-color: #9cc3ee; }
.estado-envio--entregado   { background-color: #e4f6e6; color: #1c5a24; border-color: #a5d8ad; }
.estado-envio--cancelado   { background-color: #fde5e5; color: #8a1c1c; border-color: #eda0a0; }
```

Criterio de legibilidad: `color` de texto oscuro sobre fondo claro (contraste ≥ 4.5:1) — se usan tonos pastel de fondo, no saturados. El `<select>` hereda `color` en las opciones del SO, por eso se fija `color` explícito.

---

## Tarea 5 — Precio de promoción en `/admin/productos`

**Archivo:** `src/app/admin/productos/page.tsx`

1. Ampliar el tipo `Producto` con `precio_promo?: number | null; promo_activa?: boolean | null;`.
2. Ampliar `form` con `promoActiva: boolean` y `precioPromo: number`.
3. En el `<select>` de "Precio COP" (línea ~346) añadir, en la misma rejilla:
   - Campo `¿tiene promoción?` con `<input type="checkbox" checked={form.promoActiva} …>`.
   - Si `form.promoActiva`, campo `Precio de promoción COP` (`type="number"`), deshabilitado si no.
4. En `payload` (línea ~112) añadir:
   ```ts
   promo_activa: form.promoActiva,
   precio_promo: form.promoActiva ? Number(form.precioPromo) || null : null,
   ```
5. Validación en `guardar()` antes del `insert/update`: si `promoActiva` y (`precioPromo <= 0` o `precioPromo >= precio`) → `alert("El precio de promoción debe ser mayor a 0 y menor al precio regular.")` y `return`.
6. En `editar()` (línea ~198) cargar `promoActiva: Boolean(p.promo_activa)` y `precioPromo: p.precio_promo ?? 0`. Añadir estos dos campos a los dos `setForm({...})` de reset (líneas 150 y 266).
7. En la tabla, columna `Precio`: si `p.promo_activa && p.precio_promo` mostrar `$promo` en negrita y `$precio_cop` tachado (`textDecoration: "line-through"`, `opacity: 0.6`, `fontSize: "0.8em"`); si no, solo `precio_cop` como hoy. Añadir columna `Promo` con "Sí/No" solo si no se quiere recargar la tabla (recomendado: integrarlo en la columna Precio, sin columna extra).

---

## Tarea 6 — Promo en la ficha de producto (PDP)

**Archivo:** `src/app/producto/[slug]/page.tsx`

1. Ampliar `DBProd` con `precio_promo?: number | null; promo_activa?: boolean | null;`.
2. Calcular:
   ```ts
   const promoVigente = Boolean(producto.promo_activa) && Number(producto.precio_promo) > 0;
   const precioBase = Number(producto.precio_cop ?? 0);
   const precioFinal = promoVigente ? Number(producto.precio_promo) : precioBase;
   ```
3. En el header (línea 437), sustituir `<p className="pdp-price">{precioFormato}</p>` por:
   - Si `promoVigente`: `<p className="pdp-price">{formatCOP(precioFinal)}</p>` y `<p className="pdp-price-old">{formatCOP(precioBase)}</p>` (tachado, más pequeño).
   - Si no: igual que hoy.
4. **Importante:** `handleAddToCart` (línea ~274) debe usar `precioFinal` en lugar de `precioBase`, y añadir `precioBase` al `CartItem` como `precioRegular` (opcional) para poder mostrar el tachado también en el carrito. Si se omite `precioRegular`, el carrito mostrará solo el precio cobrado (válido, pero menos informativo).
5. Añadir `.pdp-price-old` a `globals.css` junto a `.pdp-price` (línea 987):
   ```css
   .pdp-price-old { font-size: 0.85em; text-decoration: line-through; color: rgba(17,17,17,0.45); font-weight: 400; margin-top: 0.25rem; }
   ```
6. Usar `formatCOP` de `@/utils/format` para evitar duplicar el formateo.

---

## Tarea 7 — Promo en tarjetas de catálogo

**Archivos:** `src/app/coleccion/soberbia/SoberbiaClient.tsx` y `src/app/coleccion/[slug]/CollectionClient.tsx`

1. Ampliar el tipo `ProductoSoberbia` / `Producto` con `precio_promo?: number | null; promo_activa?: boolean | null;`.
2. En la tarjeta, reemplazar el bloque de precio actual por un helper compartido. Crear `src/components/product/ProductPrice.tsx`:
   ```tsx
   export default function ProductPrice({ precio, precioPromo, promoActiva, className }: Props) {
     const promo = Boolean(promoActiva) && Number(precioPromo) > 0;
     if (promo) return (
       <span className={className}>
         <span className="product-price-promo">{formatCOP(Number(precioPromo))}</span>
         <span className="product-price-old">{formatCOP(Number(precio))}</span>
       </span>
     );
     return <span className={className}>{formatCOP(Number(precio))}</span>;
   }
   ```
3. Usarlo en ambas páginas. En `SoberbiaClient` mantener la condición `linea === "origen"` (Singular sigue sin precio público; la decisión de "fallback estable" del orden cubre el resto).
4. CSS en `globals.css`:
   ```css
   .product-price-promo { font-weight: 600; }
   .product-price-old { text-decoration: line-through; color: rgba(17,17,17,0.45); font-size: 0.85em; margin-left: 0.4rem; }
   ```

---

## Tarea 8 — Orden en catálogo

**Archivos:** `SoberbiaClient.tsx`, `CollectionClient.tsx`

1. Estado: `const [orden, setOrden] = useState<"destacado" | "precio-desc" | "alfabetico">("destacado")`.
2. `useMemo` sobre `productosLinea`:
   - `destacado`: orden original (el que llega del servidor).
   - `precio-desc`: ordenar por `Number(b.precio_cop ?? 0) - Number(a.precio_cop ?? 0)`, estable; los que no tienen `precio_cop` (Singular) quedan al final sin romper el orden relativo. Desempatar por `nombre`.
   - `alfabetico`: `a.nombre.localeCompare(b.nombre, "es")`.
3. Debajo de `.line-tabs` (línea ~199 en SoberbiaClient, ~172 en CollectionClient) insertar una barra `.catalog-order-bar` con dos botones `type="button"`, `aria-pressed`, y clase activa:
   - "Precio: mayor a menor"
   - "Orden alfabético"
   - Opcional: "Restablecer" para volver a `destacado`.
4. No cambiar el `fetch` del servidor; el orden se resuelve en cliente (ambas páginas ya hacen `.order("nombre")`).

---

## Tarea 9 — Monto enviado a Wompi (promo)

**Archivo:** `src/app/producto/[slug]/page.tsx`

`handleAddToCart` ya calcula `precio`. Basta con que use `precioFinal` (Tarea 6). El flujo Wompi queda correcto sin más cambios:
- `CartContext.subtotal` suma `precio * cantidad` → `checkout/page.tsx` pasa `total` a `WebCheckoutForm`.
- `WebCheckoutForm` firma `amountInCents: Math.round(total * 100)` (`integrity/route.ts`) y lo repite en `amount-in-cents` del form y de la URL.
- `POST /api/checkout/pedido` guarda `total_cop` del mismo `total` en `pedidos.items`/`total_cop`.

**Verificación obligatoria:** confirmar que el `items[].precio` persistido en `pedidos` sea el de promoción. Como `items` se serializa tal cual desde el carrito, basta con que el carrito tenga el precio de promoción (Tarea 6). **No** recalcular precios en servidor (no hay tabla de precios en el cliente de checkout; hacerlo requeriría consultar `productos` por slug en `WebCheckoutForm`, fuera de alcance).

---

## Tarea 10 — OAuth Google / Apple

### 10.1 Refactor de `ProfileContext.tsx`

- `signInWithGoogle` / `signInWithApple`:
  - Añadir `options: { redirectTo: `${window.location.origin}/auth/callback` }`.
  - Envolver en `try/catch` y **relanzar** el error en lugar de tragarlo, para que la UI pueda mostrarlo (`setError`).
  - Antes de redirigir, `await supabase.auth.signOut()` si hay sesión previa, para evitar que un login OAuth quede "pegado" a la sesión anterior.
- `signInWithEmail` ya usa `signInWithPassword` y `onAuthStateChange` rellena el perfil; no requiere cambios.

### 10.2 Nueva ruta `src/app/auth/callback/route.ts`

```ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/mi-perfil";

  if (!code) return NextResponse.redirect(`${origin}/inicio-sesion?error=missing_code`);

  const { createClient } = await import("@supabase/supabase-js");
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data, error } = await authClient.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    console.error("[auth/callback]", error?.message);
    return NextResponse.redirect(`${origin}/inicio-sesion?error=exchange_failed`);
  }

  // Persistir perfil espejo si no existe (igual que postpago.upsertCrmCliente)
  const email = data.user.email?.toLowerCase() ?? null;
  if (email) {
    const { data: existing } = await supabaseAdmin.from("perfiles").select("id").eq("email", email).maybeSingle();
    if (!existing) {
      await supabaseAdmin.from("perfiles").insert({
        user_id: data.user.id,
        nombre: data.user.user_metadata?.full_name ?? data.user.email?.split("@")[0] ?? "Cliente",
        email,
        telefono: data.user.user_metadata?.phone ?? "",
        miembro: true,
        proveedor: data.user.app_metadata?.provider === "apple" ? "apple" : data.user.app_metadata?.provider === "google" ? "google" : "manual",
      });
    }
  }

  return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/mi-perfil"}`);
}
```

- Usa `createClient` importado arriba, no dinámico (más limpio y evita el `await import`).
- Validar `next` para evitar open-redirect: solo permitir rutas que empiecen por `/` y no por `//`.

### 10.3 UI de `inicio-sesion/page.tsx`

- Añadir estado `authError` y `authLoading`.
- `handleGoogle` / `handleApple`: `setAuthError(null); setAuthLoading(true); try { await … } catch { setAuthError("No se pudo conectar con Google/Apple. Inténtalo de nuevo.") } finally { setAuthLoading(false) }`.
- Deshabilitar ambos botones mientras `authLoading`.
- **Eliminar** el párrafo `.auth-pending` (líneas 72-75): ya no aplica.

### 10.4 UI de `CrearPerfil.tsx`

- Eliminar el bloque `.auth-pending` (líneas 136-142) y el `proveedor` local (ya no se usa para nada más que ese mensaje). Mantener `signInWithGoogle/Apple` con manejo de error igual que en 10.3.

### 10.5 Configuración Supabase (fuera del código, documentar en el plan de implementación)

Instrucciones para el usuario en Supabase Dashboard → Authentication → Providers:
- **Google:** activar, pegar Client ID/Secret de Google Cloud Console (OAuth consent screen + Authorized redirect URI `https://<project>.supabase.co/auth/v1/callback`).
- **Apple:** activar, configurar Sign in with Apple en el Apple Developer account (Service ID, Private Key `.p8`, Key ID, Team ID) y pegar en Supabase.
- **URL Configuration → Redirect URLs:** añadir `https://<dominio>/auth/callback` y `http://localhost:3000/auth/callback`.

### 10.6 `.env.example`

Documentar que no se requieren variables nuevas para OAuth (Supabase gestiona los secretos), pero sí listar `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` como precondición del callback (ya presentes).

---

## Tarea 11 — Mitigar el upsert de checkout (recomendado, evita regresión)

**Archivo:** `src/app/api/checkout/pedido/route.ts`

El upsert sobrescribe columnas del admin. Cambiar a un patrón "insert si no existe, update solo si no está pagado":

```ts
const { data: existing } = await supabaseAdmin
  .from("pedidos").select("id, estado_pago, post_pago_procesado_at").eq("numero_pedido", numero_pedido).maybeSingle();

if (existing) {
  // Solo actualizar datos del cliente/dirección; nunca estado_envio/pago/postpago.
  await supabaseAdmin.from("pedidos").update({
    cliente_nombre, cliente_email, cliente_telefono, direccion_envio: datos, items, total_cop, updated_at: new Date().toISOString(),
  }).eq("id", existing.id);
} else {
  await supabaseAdmin.from("pedidos").insert({ /* …mismos campos… */ });
}
```

Si el desarrollador prefiere no tocar este archivo en este cambio, documentarlo como riesgo conocido: un segundo intento de pago puede revertir `estado_envio` y `guia_rastreo`.

---

## Orden de ejecución recomendado

1. Migración SQL (Tarea 1) — desbloquea el enum.
2. API pedidos: DELETE + allowlist (Tareas 2 y 4 backend).
3. UI pedidos: modal + color + borrado (Tareas 2, 3, 4 frontend).
4. Admin productos: campos promo (Tarea 5).
5. PDP + tarjetas + orden (Tareas 6, 7, 8).
6. Callback OAuth + refactor ProfileContext + UI (Tarea 10).
7. Mitigación upsert checkout (Tarea 11) — opcional pero recomendado.

---

## Validación manual (checklist)

- [ ] Migración aplicada: `select enum_range(null::estado_envio_enum)` incluye `CANCELADO`.
- [ ] En `/admin/pedidos`: el `<select>` muestra las 4 opciones; al elegir cada una el fondo cambia (naranja/azul/verde/rojo claros) y el texto sigue legible.
- [ ] El modal muestra nombre, email, teléfono, dirección, barrio, ciudad, departamento, código postal y observaciones. Con un pedido sin `direccion_envio` muestra "Sin dirección registrada".
- [ ] Botón Eliminar pide confirmación, borra la fila, y si el pedido estaba `APROBADO` el stock de cada `productos` sube exactamente `cantidad`.
- [ ] En `/admin/productos`: al marcar "tiene promoción" aparece el campo; guardar con `precio_promo >= precio` lanza el `alert` y no guarda.
- [ ] En `/coleccion/soberbia` (origen): la tarjeta muestra `$promo` y `$regular` tachado. En singular no hay precio.
- [ ] En `/producto/[slug]`: PDP muestra promo tachada; "Tejer esta Historia" agrega al carrito con `precio = precio_promo`.
- [ ] En `/checkout`: el `amount-in-cents` de la URL de Wompi coincide con `precio_promo * cantidad` (inspeccionar la redirección o el `console.log` de `WebCheckoutForm.tsx:116`).
- [ ] En `/coleccion/soberbia` y `/coleccion/[slug]`: los botones de orden cambian el orden; "precio mayor a menor" deja Singular al final sin error; "alfabético" ordena A→Z con `localeCompare("es")`.
- [ ] En `/inicio-sesion`: "Continuar con Google" redirige a Google, vuelve a `/auth/callback`, aterriza en `/mi-perfil` con el perfil creado y el header muestra "Cuenta conectada con Google".
- [ ] Con sesión previa activa, pulsar "Continuar con Apple" no queda bloqueado en la sesión anterior (se hace `signOut` antes de redirigir).
- [ ] `npm run lint` y `npx tsc --noEmit` sin errores nuevos.