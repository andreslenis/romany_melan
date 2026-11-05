# Plan: Wompi post-pago — redirección, stock, pedido y CRM

## Contexto (hallazgos)
- **Checkout/redirect**: `src/lib/wompi.ts` usa `NEXT_PUBLIC_WOMPI_REDIRECT_URL` → `/checkout/respuesta`. `WebCheckoutForm.tsx:81-111` inserta pedido `PENDIENTE` (cliente, `supabase`) y redirige a Wompi con `redirect-url`. `checkout/respuesta/page.tsx` consulta `pedidos` por `wompi_transaction_id` o `numero_pedido` usando el param `id`.
- **Webhooks (dos rutas)**: `src/app/api/wompi/webhook/route.ts` (canónico) valida firma (`WOMPI_EVENT_SECRET`, SHA-256 sobre `signature.properties`+`timestamp`) y solo actualiza estado; mapea `ERROR` a `PENDIENTE`. `src/app/api/wompi/b/bwebhook/route.ts` intenta además descontar stock y crear `perfiles`, pero está **roto** (typos: `estado_pag/numero_ped` vs esquema, `clienteNombre/Email/Telefono` vs columnas `cliente_*`, `pedidolData`/espacio en key) y **no es idempotente**. No está claro cuál URL está registrada en el panel Wompi.
- **Esquema `supabase/schema.sql`**: `pedidos` carece de `wompi_status, metodo_pago, ambiente, updated_at, transportadora` que el código ya escribe/lee; `estado_pago_enum` no incluye `ERROR`. `productos.stock_disponible` existe. `perfiles` actúa como CRM base.
- **Admin**: `/admin/pedidos` muestra pedidos/estados/guía (gestor de pedidos y envíos). `/admin/clientes` arma “CRM de Clientes/El Círculo” desde `pedidos`+`perfiles`. RLS actual de `pedidos/perfiles` es permisiva `anon` (revisar como parte de hardening).

## Decisiones confirmadas
- Incluir **migración SQL** en `supabase/` (confirmado por usuario).

## Objetivos
1. Redirigir correctamente a la página de respuesta tras pago completado en Wompi.
2. Al confirmarse pago aprobado, rebajar stock del/los producto(s) del pedido.
3. Asegurar registro/actualización del pedido en el gestor de pedidos y envíos al completarse el pago.
4. Asegurar registro de info del cliente en el CRM al completarse un pago.

## Plan de implementación (orden recomendado)

### 1) Migración de base de datos (`supabase/migrations/…` o archivo SQL versionado)
- `ALTER TABLE pedidos` ADD IF NOT EXISTS: `wompi_status text`, `metodo_pago text`, `ambiente text`, `updated_at timestamptz default now()`, `transportadora text` (usada por admin), y **`post_pago_procesado_at timestamptz`** (marca idempotencia post-aprobación: stock+CRM).
- Extender `estado_pago_enum` para incluir `ERROR` (manejar `ALTER TYPE ... ADD VALUE IF NOT EXISTS` fuera de transacción según Postgres/Supabase).
- (Opcional, validar con uso real) índice único parcial o constraint para evitar duplicados de pedido por `numero_pedido` ya existe; considerar índice en `wompi_transaction_id`.
- **Idempotencia**: toda lógica de “efectos de aprobación” (stock, CRM) se ejecuta solo si `estado_pago` transiciona a aprobado y `post_pago_procesado_at IS NULL`; al completar, setear `post_pago_procesado_at` atómicamente (misma operación/condición) para tolerar reintentos de Wompi.
- Verificar/ajustar RLS: inserción de pedido desde checkout hoy usa cliente anon (`supabase`); asegurar que la política permita solo lo necesario y que el webhook (service role) pueda actualizar. No relajar más de lo requerido.

### 2) Unificar y corregir el webhook Wompi (fuente de verdad post-pago)
- Consolidar en **una** ruta canónica (`src/app/api/wompi/webhook/route.ts`). Eliminar o hacer que `b/bwebhook` delegue/redirija internamente para evitar lógica duplicada rota. **Confirmar en despliegue/panel** qué URL de eventos está configurada y alinearla.
- Corregir mapeo de estado: `APPROVED→APROBADO`, `DECLINED/RECHAZADO→RECHAZADO`, `ERROR/VOIDED→ERROR` (persistir valor crudo en `wompi_status`), otros `PENDIENTE`. Usar nombres de columna reales (`estado_pago`, `numero_pedido`, `wompi_transaction_id`, `updated_at`).
- **Búsqueda de pedido**: por `numero_pedido = reference`. Si no existe (pedido no insertado en cliente), crear un registro mínimo desde datos de transacción si están disponibles, o registrar log/alerta y devolver 200 (documentar limitación) — preferir garantizar inserción desde checkout (paso 3) para no perder `items/cliente`.
- **Al aprobar (idempotente)**: leer `items` y datos cliente del pedido; rebajar `productos.stock_disponible` por cada `item.slug` × `cantidad` (`GREATEST(0, stock-cant)`). Considerar condición de concurrencia (RPC/SQL atómico o `update ... where stock_disponible>=cant` por ítem) y caso de producto/slug inexistente (log, no fallar todo el webhook).
- **CRM al aprobar**: upsert en `perfiles` por `email` normalizado (si hay email) con `nombre/telefono`; no duplicar. Definir si `proveedor`/`miembro` se actualizan o solo se crean.
- Responder **200** solo cuando el evento se procesó o se descartó con seguridad; ante error transitorio de DB, considerar devolver no-2xx para que Wompi reintente (balancear con idempotencia ya garantizada) — documentar elección.
- Mantener verificación de firma estricta; nunca confiar en payload sin checksum válido.

### 3) Checkout: creación fiable del pedido y redirección
- `WebCheckoutForm.tsx`: asegurar que el `insert` en `pedidos` ocurra **antes** de redirigir y **manejar error** (hoy se ignora). Incluir `metodo_pago:'web_checkout'`, `ambiente`, `estado_pago:'PENDIENTE'`, `wompi_transaction_id:null`. Si insert falla, mostrar error y **no** redirigir (evita pedidos huérfanos sin items para stock/CRM).
- Usar `supabaseAdmin` vía endpoint server (`/api/...`) para insertar si RLS anon complica fiabilidad/seguridad, en lugar de insert directo desde cliente — evaluar tradeoff y ajustar plan.
- Redirección Wompi: verificar que `NEXT_PUBLIC_WOMPI_REDIRECT_URL` apunte al dominio desplegado (`/checkout/respuesta`) y que el dominio esté permitido en el panel Wompi. Mantener `redirect-url` en el request y fallback de config. (Código actual ya lo envía; si “no redirige”, causa probable es config de panel/entorno o URL no permitida — incluir checklist operativo en la entrega).

### 4) Página de respuesta (`/checkout/respuesta`)
- Wompi redirige con `id` = **id de transacción**; la búsqueda actual por `numero_pedido.eq.{id}` no matcheará. Ajustar estrategia: (a) consultar estado de transacción server-side vía API Wompi usando `id` y mostrar/conciliar; o (b) si Wompi incluye referencia accesible, usarla; o (c) almacenar mapping. **Recomendado**: endpoint server que, dado `transactionId`, consulte Wompi (fuente autoritativa) + lea/actualice `pedidos` por `wompi_transaction_id/reference`, y que la página consuma ese endpoint (evita exponer secretos y resuelve timing si webhook tarda).
- Manejar estados `APPROVED/DECLINED/VOIDED/ERROR/PENDING` con mensajes claros; ofrecer reintento/volver a colección.
- **No** descontar stock ni registrar CRM en la página de respuesta (solo webhook server-side) para evitar duplicados/fraude.

### 5) Gestor de pedidos y envíos / CRM (verificación y ajustes)
- `/admin/pedidos`: verificar que refleja `estado_pago`/`wompi_status`/`wompi_transaction_id` actualizados por webhook; alinear valores de `estado_envio` mostrados con enum real si difieren (`EN_PREPARACION/ENVIADO/ENTREGADO` vs etiquetas libres).
- `/admin/clientes`: confirmar que un pago aprobado con email crea/actualiza `perfiles` y que el cliente aparece (ya deriva de pedidos+perfiles; mejorar consistencia si falta perfil).
- Añadir visibilidad útil (opcional): columna/indicador de pago aprobado, link a transacción, filtro — solo si se desea alcance mayor.

### 6) Configuración, pruebas y rollout
- **Env vars**: validar `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENT_SECRET`, `NEXT_PUBLIC_WOMPI_*`, `SUPABASE_SERVICE_ROLE_KEY` en todos los entornos. Secretos de integridad vs eventos son distintos.
- **Panel Wompi**: registrar URL de eventos al webhook canónico; configurar redirect URL permitida.
- **Pruebas (sandbox TEST)**: flujo aprobado → redirect a respuesta, pedido actualizado en `/admin/pedidos`, stock decrementado correctamente, perfil/CRM reflejado; rechazo/error; reintento de webhook (misma transacción) no descuenta stock doble (idempotencia). Cubrir item con slug faltante y multi-item.
- **Migración prod**: aplicar SQL en ventana controlada; backfill mínimo si hay pedidos pendientes con columnas nuevas nulas.

## Archivos clave a tocar (referencia)
- `supabase/schema.sql` (+ migración nueva en `supabase/`)
- `src/app/api/wompi/webhook/route.ts` (consolidar/corregir)
- `src/app/api/wompi/b/bwebhook/route.ts` (eliminar o delegar)
- `src/components/checkout/WebCheckoutForm.tsx`
- `src/app/checkout/respuesta/page.tsx` (+ posible `src/app/api/wompi/transaction/route.ts` o similar)
- `src/app/admin/pedidos/page.tsx`, `src/app/admin/clientes/page.tsx` (ajustes menores/verificación)
- `.env.example` (documentar vars si faltan)

## Riesgos / casos borde
- **Doble descuento de stock** si no hay idempotencia → mitigado con `post_pago_procesado_at` + condición atómica.
- **Pedido sin insertar** antes del redirect → sin items/cliente no se puede rebajar stock/CRM de forma fiable; hacer insert bloqueante o server-side.
- **Desajuste esquema/código** (`estado_pag`, `numero_ped`, columnas inexistentes) rompe webhook silenciosamente (devuelve 200) → corregir y agregar logging/observabilidad.
- **Race webhook vs redirect**: página puede ver `PENDIENTE` aún; consulta server-side a Wompi + polling breve resuelve UX.
- **RLS/permisos**: inserts/updates desde cliente vs service role; no exponer service role al browser.
- **Concurrencia de stock** en compras simultáneas del mismo producto → usar operación atómica en DB.

## Criterios de aceptación
- Tras pago `APPROVED` en Wompi, el usuario aterriza en `/checkout/respuesta` con estado confirmado (o conciliado en segundos).
- `pedidos.estado_pago`/ids Wompi actualizados y visibles en `/admin/pedidos`.
- `productos.stock_disponible` decrementa exactamente una vez por ítem aprobado, incluso con reintentos de webhook.
- Existe/actualiza registro del cliente en `perfiles` y es visible en el CRM/admin clientes cuando aplica.
- Pruebas sandbox pasan para aprobado, rechazado, error y reintento.
