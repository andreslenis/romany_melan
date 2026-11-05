# Plan: Pedidos/clientes guardados en BD no visibles en `/admin/pedidos` y `/admin/clientes`

## Diagnóstico (evidencia en código)

1. **Lecturas admin desde el navegador con el cliente anon**: `src/app/admin/pedidos/page.tsx:5,32` y `src/app/admin/clientes/page.tsx:5,45-46` usan `supabase` (`src/lib/supabase/client.ts`, `NEXT_PUBLIC_*` anon key). Hacen `select("*")` y **descartan errores** (`setPedidos(data || [])`; no se inspecciona `error`), por lo que cualquier fallo de permisos/RLS se muestra como “No hay pedidos registrados”/lista vacía.
2. **RLS habilitado sin política `SELECT` para rol `authenticated` en tablas sensibles**: `supabase/schema.sql:89-90,95-96` habilita RLS en `pedidos` y `perfiles` y crea solo políticas `anon_all_pedidos` / `anon_all_perfiles` (`FOR ALL TO anon USING (true)`). No existen políticas equivalentes para `authenticated` (sí existen para `colecciones/productos`, `:92-93`).
3. **El admin navega autenticado**: `src/components/admin/AdminGuard.tsx:14-16` permite acceso si hay `session` (cualquier usuario Supabase). Con sesión, el cliente envía el JWT del usuario y PostgREST evalúa como rol **`authenticated`** → **RLS bloquea** `SELECT` en `pedidos`/`perfiles` → `data` vacío/`error` de permiso, silenciado por la UI. Esto explica “se guardan (writes por service role/anon según flujo) pero no se ven en admin”.
4. **Escrituras no afectadas**: creación de pedido server-side usa `supabaseAdmin` (`src/app/api/checkout/pedido/route.ts:2,59`); webhook/post-pago usan `supabaseAdmin` (`src/lib/wompi/postpago.ts` vía webhook) → bypass RLS. El admin de pedidos también hace `update` desde cliente (`:40,46`) y fallaría silenciosamente bajo el mismo problema.
5. **CRM depende de ambas fuentes**: `/admin/clientes` arma la vista desde `pedidos` (y enriquece con `perfiles`, `:52-74`). Si `pedidos` no se lee, no aparecen clientes; si `perfiles` no se lee, tampoco se reflejan perfiles sin pedido visible. Perfiles creados por post-pago (service role) existen en BD pero la lectura autenticada está bloqueada.

> Confirmación recomendada al implementar: reproducir en el navegador/Network la respuesta de `rest/v1/pedidos` y `rest/v1/perfiles` (o loguear `error` temporalmente) para verificar el código/mensaje RLS antes de cerrar el fix.

## Objetivos
- `/admin/pedidos` lista pedidos existentes y permite actualizar estado/guía.
- `/admin/clientes` muestra clientes/perfiles (incluidos los registrados por compra) coherentes con BD.
- No exponer datos PII de `pedidos`/`perfiles` al público ni debilitar RLS.

## Enfoque recomendado (autorización requerida)
Mover lecturas/escrituras admin de `pedidos` y `perfiles` a **rutas API server-side** que usan `supabaseAdmin` (service role), protegidas por verificación de admin real; mantener RLS restrictiva en BD (no abrir `authenticated/anon` amplio sobre PII).

### Tareas

1. **Verificación admin server-side reutilizable** (`src/lib/...` o helper en rutas admin API)
   - Dado el request, obtener usuario (cookie/session de Supabase o token Bearer enviado por el cliente autenticado) y confirmar pertenencia/rol admin (p. ej. tabla `admins` `schema.sql:80-84` y/o claim). **No** confiar solo en `getSession()` del cliente. Definir contrato claro (401/403).
   - Nota: hoy `AdminGuard` solo chequea sesión; reforzar guard server-side es parte del fix de seguridad (alcance mínimo necesario para estas rutas).

2. **API admin para pedidos** (p. ej. `src/app/api/admin/pedidos/route.ts` + `[id]` o acción)
   - `GET`: listar pedidos ordenados por `created_at desc` (campos necesarios).
   - `PATCH`: actualizar `estado_envio`/`transportadora`/`guia_rastreo`/`updated_at` por `id`, validando entrada.
   - Usa `supabaseAdmin`. Respuestas JSON tipadas; errores explícitos.

3. **API admin para CRM/clientes** (p. ej. `src/app/api/admin/clientes/route.ts`)
   - `GET`: devolver `pedidos` (campos usados por la vista) y `perfiles` necesarios, o una vista agregada server-side. Mantener la lógica actual de agrupación en cliente o moverla al server (decisión de implementación; preferir payload mínimo sin PII extra).

4. **Actualizar UI admin**
   - `src/app/admin/pedidos/page.tsx`: `fetch('/api/admin/pedidos')` para cargar; `PATCH` para `actualizarEstado`/`guardarDespacho`. Manejar `loading`/`error` visibles (no silenciar). Mantener comportamiento actual.
   - `src/app/admin/clientes/page.tsx`: consumir API admin; mostrar estado de carga/error.
   - Conservar `AdminGuard` como UX gate; la autorización real vive en el server.

5. **RLS / migración (defensa en profundidad)**
   - Agregar migración `supabase/migrations/...` que **no** abra `anon` sobre `pedidos`/`perfiles` más allá de lo estrictamente necesario. Opciones a decidir: (a) política `SELECT/UPDATE` para `authenticated` restringida a admins (via función/check contra `admins`), o (b) sin políticas amplias si todo acceso admin pasa por service role + rutas protegidas. Revisar `anon_all_pedidos`/`anon_all_perfiles` (`schema.sql:95-96`) por riesgo PII; cualquier endurecimiento debe validarse contra flujos checkout/respuesta existentes.
   - Actualizar `supabase/schema.sql` espejo.

6. **Validación**
   - Con usuario admin autenticado: `/admin/pedidos` muestra registros existentes; cambio de estado/guía persiste. Repetir en sesión no admin → 401/403 sin datos.
   - `/admin/clientes`: aparecen perfiles/compras reales; se refleja cliente creado por post-pago aprobado.
   - Red/console sin errores RLS; UI muestra error legible si la API falla.
   - `tsc --noEmit` + `next lint`/build pasan.

## Archivos clave
- `src/app/admin/pedidos/page.tsx`, `src/app/admin/clientes/page.tsx`
- `src/components/admin/AdminGuard.tsx`
- `src/lib/supabase/client.ts` (sin cambios previstos; dejar de usarlo para PII admin)
- Nuevas rutas: `src/app/api/admin/pedidos/*`, `src/app/api/admin/clientes/route.ts`
- `supabase/schema.sql` + nueva migración en `supabase/migrations/`
- Tabla/rol admin: `admins` (`schema.sql:80-84`)

## Riesgos / decisiones abiertas
- **Modelo de auth admin**: cómo se identifica al admin hoy (tabla `admins` vs cualquier sesión). El plan asume verificación contra `admins`; confirmar al implementar.
- **Endurecer `anon_all_*`** puede romper inserciones/lecturas legítimas del checkout/respuesta si dependen de rol anon; requiere prueba de flujo completo.
- **Exposición de service role**: solo en server routes; nunca en cliente.

## Solicitud de autorización
¿Autorizas implementar el **enfoque recomendado** (APIs admin server-side con `supabaseAdmin` + verificación admin, UI consumiendo esas APIs con manejo de errores, y migración/RLS de defensa en profundidad), procediendo luego a los cambios de código/migración? Responde **“Autorizado, implementar”** (o indica ajustes: p. ej. solo arreglar RLS sin APIs, o solo UI+errores) y lo ejecuto.

## Estado
- **Autorizado (2026-11-05):** “Autorizado, implementar (Recomendado)”. Plan listo para ejecución por un agente con permisos de edición/comandos.
