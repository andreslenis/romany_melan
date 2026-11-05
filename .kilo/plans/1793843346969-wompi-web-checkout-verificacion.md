# Plan de verificación — Web Checkout de Wompi

**Objetivo:** Integrar el método **Web Checkout** de Wompi (formulario HTML estándar, GET a `https://checkout.wompi.co/p/`) y definir el plan de verificación correcto, **retirando completamente el Widget** y dejando solo Web Checkout como único método de pago.

**Stack:** Next.js 15 (App Router) + Supabase + Tailwind.  
**Dominio de pruebas (TEST):** `https://romanymelan-ebon.vercel.app`  
**Archivos clave existentes:** `src/lib/wompi.ts`, `src/components/checkout/WompiPayment.tsx` (Widget — a eliminar), `src/app/checkout/page.tsx`, `src/app/api/wompi/integrity/route.ts`, `.env.example`.

---

## Decisiones de diseño

1. **Web Checkout = form HTML**, no widget.js. Se renderiza un `<form action="https://checkout.wompi.co/p/" method="GET">` con inputs ocultos obligatorios: `public-key`, `currency`, `amount-in-cents`, `reference`, `signature:integrity`. Opcionales: `redirect-url`, `expiration-time`, `customer-data:*`, `shipping-address:*`, `tax-in-cents:*`.
2. **Firma de integridad siempre en servidor.** Reutilizar/validar `/api/wompi/integrity` (SHA256 sobre `reference + amountInCents + currency + secreto_integridad`). Nunca exponer `WOMPI_INTEGRITY_SECRET` en el frontend.
3. **redirect-url es solo informativa.** Wompi redirige a `...?id=<transaccion>`. La página de destino (`/checkout/respuesta` o reuso de `/checkout/confirmado`) solo muestra estado al usuario; **no valida** el pago.
4. **Validación real vía webhook `transaction.updated`.** Nueva ruta `POST /api/wompi/webhook` que: lee `signature.properties`, concatena esos valores + `timestamp` + `WOMPI_EVENT_SECRET`, calcula SHA256, compara con `signature.checksum`; si coincide, lee `data.transaction.status` y actualiza el pedido en Supabase por `reference`. Responde siempre `200`.
5. **Entorno TEST para verificación** (`pub_test_*`, `NEXT_PUBLIC_WOMPI_ENV=TEST`). Pasar a PROD solo al ir a producción con `pub_prod_*`.
6. **Idempotencia por `reference`:** no reusar referencias ya existentes en la BD (evita pagos duplicados).

---

## Variables de entorno (confirmar/agregar)

| Variable | Origen | Nota |
|---|---|---|
| `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` | Dashboard Wompi | Usar `pub_test_*` en TEST |
| `NEXT_PUBLIC_WOMPI_ENV` | `TEST` / `PROD` | TEST para verificación |
| `WOMPI_INTEGRITY_SECRET` | Dashboard > Desarrolladores > Secretos | Para firma del formulario |
| `WOMPI_EVENT_SECRET` | Dashboard > Mi cuenta > Secretos | **Distinta** a la de integridad; para webhook |
| `NEXT_PUBLIC_WOMPI_REDIRECT_URL` | `https://romanymelan-ebon.vercel.app/checkout/respuesta` | URL de retorno tras el pago (TEST) |

Faltan en `.env.example`: `WOMPI_EVENT_SECRET` y `NEXT_PUBLIC_WOMPI_REDIRECT_URL`.

---

## Tareas del plan de verificación

### 1. Configuración de entorno
- [ ] Agregar `WOMPI_EVENT_SECRET` y `NEXT_PUBLIC_WOMPI_REDIRECT_URL` a `.env.example` y `.env.local`.
- [ ] Confirmar `NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_*` y `NEXT_PUBLIC_WOMPI_ENV=TEST`.
- [ ] Verificar que `WOMPI_INTEGRITY_SECRET` coincida con el dashboard TEST.
- [ ] `NEXT_PUBLIC_WOMPI_REDIRECT_URL=https://romanymelan-ebon.vercel.app/checkout/respuesta`
- [ ] Webhook URL: `https://romanymelan-ebon.vercel.app/api/wompi/webhook`

### 2. Ruta de firma de integridad (reutilizar / validar)
- [ ] Validar `/api/wompi/integrity`: genera `SHA256(reference + amountInCents + currency + WOMPI_INTEGRITY_SECRET)`.
- [ ] Si se usa `expiration-time`, incluirlo en la concatenación antes del secreto (orden: `reference + amount + currency + expirationTime + secreto`).
- [ ] Probar endpoint con payload de ejemplo y comparar hash contra el esperado del manual de Wompi.

### 3. Componente Web Checkout (reemplazar y eliminar Widget)
- [ ] Crear `src/components/checkout/WebCheckoutForm.tsx` que renderice el `<form action="https://checkout.wompi.co/p/" method="GET">` con inputs ocultos obligatorios (`public-key`, `currency`, `amount-in-cents`, `reference`, `signature:integrity`) y opcionales (`redirect-url`, `customer-data:*`, `shipping-address:*`, `expiration-time`).
- [ ] Llamar a `/api/wompi/integrity` para obtener `signature:integrity` antes de montar/enviar el formulario (o renderizarla en servidor).
- [ ] Reemplazar `<WompiPayment>` por `<WebCheckoutForm>` en `src/app/checkout/page.tsx` (paso 2 del checkout).
- [ ] Eliminar `src/components/checkout/WompiPayment.tsx` y toda referencia al Widget (`WompiScript`, `WidgetCheckout`, `window.WompiCheckout`, `loadWompiScript`).
- [ ] Simplificar `src/lib/wompi.ts`: eliminar lógica del Widget y de carga de script; mantener solo constantes de entorno y utilidad de firma si aplica.

### 4. Página de respuesta (redirect-url)
- [ ] Crear `src/app/checkout/respuesta/page.tsx` (o reutilizar `/checkout/confirmado`) que lea el parámetro `?id=<transaccion>` desde la URL.
- [ ] Mostrar estado **informativo** al cliente; NO marcar el pedido como pagado solo por esta URL.

### 5. Webhook de transacciones
- [ ] Crear `src/app/api/wompi/webhook/route.ts` (`POST`).
- [ ] Implementar verificación del checksum: extraer `signature.properties`, concatenar valores de `data` + `timestamp` + `WOMPI_EVENT_SECRET`, `SHA256`, comparar con `signature.checksum`.
- [ ] Si el checksum no coincide: ignorar el evento y responder `200` (Wompi reintentará hasta 3 veces; no devolver error que active reintentos inútiles).
- [ ] Si coincide: leer `data.transaction.status` (`APPROVED` / `DECLINED` / `VOIDED` / `ERROR`) y `data.transaction.reference`; actualizar pedido en Supabase por `reference`.
- [ ] Responder siempre `200` (cuerpo vacío o JSON).

### 6. Configuración en Dashboard de Wompi
- [ ] Registrar URL de eventos (TEST): `https://romanymelan-ebon.vercel.app/api/wompi/webhook` para recibir `transaction.updated`.
- [ ] Registrar dominio `romanymelan-ebon.vercel.app` en dominios permitidos del panel de Wompi (para `redirect-url`).
- [ ] Usar URL distinta para TEST y PROD.

### 7. Pruebas en sandbox (verificación funcional)
- [ ] Flujo completo: carrito → checkout → formulario Web Checkout → pago con tarjetas de prueba Wompi (TEST).
- [ ] Casos: `APPROVED`, `DECLINED`, `ERROR`; verificar que el pedido en Supabase refleje el estado final vía webhook.
- [ ] Verificar que no se dupliquen pedidos al reusar la misma `reference` (idempotencia).
- [ ] Verificar que el webhook responde `200` y que Wompi no reintenta innecesariamente.
- [ ] Verificar que la página de respuesta (`/checkout/respuesta?id=...`) recibe `?id=` y muestra información al usuario.
- [ ] Verificar que el Widget fue eliminado por completo (no hay referencias a `widget.js` ni `WindowCheckout`).

---

## Criterios de aceptación (checklist de verificación)

- [ ] La firma de integridad se genera solo en backend y coincide con el algoritmo SHA256 de Wompi.
- [ ] El formulario Web Checkout envía todos los parámetros obligatorios con prefijo correcto (`data-` no aplica; son `name` de input).
- [ ] El webhook valida el checksum con `WOMPI_EVENT_SECRET` y solo entonces actualiza el pedido.
- [ ] El estado del pedido en Supabase se actualiza a `APPROVED`/`DECLINED`/`ERROR` tras el webhook.
- [ ] La redirección post-pago funciona y muestra `?id=<transaccion>`.
- [ ] No hay claves secretas expuestas en el frontend ni en el código cliente.
- [ ] En producción, todo corre bajo HTTPS y con claves `pub_prod_*`.

---

## Decisiones resueltas (sin preguntas abiertas)

- **Dominio de pruebas:** `https://romanymelan-ebon.vercel.app`. Webhook: `https://romanymelan-ebon.vercel.app/api/wompi/webhook`. Redirect-url: `https://romanymelan-ebon.vercel.app/checkout/respuesta`.
- **Widget eliminado:** solo queda Web Checkout. Se borra `WompiPayment.tsx` y la lógica de carga de `widget.js`.

---

**Nota:** Este plan es de diseño/verificación. No se implementa código fuente en este paso. Un agente de implementación puede ejecutar las tareas marcadas con `[ ]` a partir de este plan.