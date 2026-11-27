# Plan: Admin define % de descuento y % de comisión por código de embajador

## Objetivo

En el admin de embajadores (`/admin/embajadores`), el admin puede colocar libremente, por cada código, dos porcentajes:

- **% de descuento al comprador** (se aplica al total del pedido).
- **% de comisión al embajador/vendedor** (se calcula sobre el total con descuento y se guarda como comisión pendiente).

Hoy `codigos_descuento.porcentaje_descuento` (default 5) se usa para el descuento (pricing-server) y la comisión está hardcodeada en 10% en checkout.

## Decisiones

1. **Almacenamiento**: agregar columna `porcentaje_comision numeric default 10` a `codigos_descuento` vía nueva migración. Se conserva `porcentaje_descuento` existente. Default para códigos nuevos: `porcentaje_descuento = 5`, `porcentaje_comision = 10` (preserva el comportamiento actual). Códigos existentes heredan `porcentaje_comision = 10`.

2. **Tabla `comisiones_embajador`**: `comision_porcentaje` guarda el porcentaje real usado por ese código; el monto sigue calculándose sobre `total_con_descuento` como hoy.

3. **UI (modal Crear/Editar)**: dos inputs numéricos (`type="number"`, `min="0"`, `step="0.01"`): "% Descuento comprador" y "% Comisión embajador". Se precargan al editar. Se muestra una columna "Reparto" en el listado (ej. "5% desc / 10% com").

4. **API admin (`route.ts`)**:
   - GET: seleccionar y devolver `porcentaje_descuento`, `porcentaje_comision` de `codigos_descuento`; incluirlos en el `formatted`.
   - POST: aceptar ambos porcentajes en el body e insertar ambas columnas (default 5/10 si no se envían).
   - PATCH: cuando se envíen los porcentajes, actualizar ambas columnas en `codigos_descuento` (por `codigo`/`embajador_id`); en PATCH parcial (solo activo/nombre/teléfono) se preservan los valores existentes.

5. **Checkout (`pedido/route.ts`)**: leer `porcentaje_comision` de `codigoData` y usarlo en lugar de `porcentajeComision = 10` hardcodeado; guardarlo en `comision_porcentaje`.

6. **Sin cambios**: `pricing-server.ts` (ya lee `porcentaje_descuento` de BD); `wompi/postpago.ts` (solo confirma estado de comisión).

## Archivos afectados

1. `supabase/migrations/20261127000000_codigos_descuento_comision.sql` (nuevo)
   - `alter table codigos_descuento add column if not exists porcentaje_comision numeric default 10;`
2. `src/app/api/admin/embajadores/route.ts` — GET, POST, PATCH (ver decisiones 3 y 4).
3. `src/app/admin/embajadores/page.tsx` — tipo `Embajador`, `formData`, modal (dos inputs), tabla (columna Reparto).
4. `src/app/api/checkout/pedido/route.ts` — usar `porcentaje_comision` de BD.

## Validación

- `npm run lint` (`next lint`)
- `npm run build` (incluye TypeScript de Next.js)
- Manual: crear embajador con porcentajes personalizados (ej. 15% desc / 8% com), verificar GET devuelve los valores, y que en checkout se aplica el descuento y comisión esperados.
- No hay tests de unidad/integración en el repo.

## Riesgos / notas

- Checkout envuelve la creación de comisiones en try/catch sin fallar el pedido; mantener ese comportamiento.
- No se agrega validación de rango (0-100) en este plan; si se desea, agregarla en la API/admin.
