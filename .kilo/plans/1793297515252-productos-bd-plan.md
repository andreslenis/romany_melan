# Plan: Integrar gestor de productos con la BD y galería por pecado

## Contexto
- El admin (`src/app/admin/productos/page.tsx`) ya lee/escribe en la tabla `productos` de Supabase.
- La galería pública (`src/app/coleccion/soberbia/SoberbiaClient.tsx`) también lee de `productos`, pero solo filtra por `activo`, sin relación con la colección/pecado.
- El PDP (`src/app/producto/[slug]/page.tsx`) y `src/data/productos.ts` usan datos **hardcoded** (solo Soberbia), por eso los productos editados/creados en el admin no se reflejan y el emparejamiento de líneas (`par`) solo existe en código.

## Objetivos
1. Que el gestor de productos (admin) sea la fuente de verdad (BD) y que editar/crear/eliminar se refleje en la galería y PDP.
2. Soportar múltiples colecciones (pecados), cada una con productos de dos líneas (Origen y Singular).
3. Mostrar productos en la galería según el pecado seleccionado.

## Cambios propuestos

### 1. Esquema / datos
- Asegurar `productos.coleccion_id` FK a `colecciones.id` y migrar/seed los productos hardcoded actuales a la BD (script de seed o insert manual).
- Agregar campo `par_slug` (o usar convención) en `productos` para emparejar Origen↔Singular. Alternativa: emparejar por `slug` base o por campo `par_slug`.

### 2. Admin productos
- Agregar selector de colección (pecado) al formulario y enviar `coleccion_id` en el payload (hoy el campo `coleccion` no se envía).
- En edición, cargar `coleccion_id` actual.
- Filtrar la tabla por colección seleccionada (opcional).

### 3. Rutas públicas
- Crear ruta dinámica `src/app/coleccion/[slug]/page.tsx` + client que cargue colección y productos por `coleccion_id`, filtrando por línea.
- Mantener (o redirigir) `/coleccion/soberbia` a la nueva ruta.
- PDP: obtener producto por slug desde Supabase en lugar de `productos.ts`; obtener contraparte por `par_slug`; "También te puede gustar" desde la misma colección.

### 4. Eliminar dependencia hardcoded
- Deprecar `src/data/productos.ts` (o convertirlo en seed). Mover helpers (`lineasDe`, `contraparte`) a consultar BD.

### 5. Galería por pecado
- Listar colecciones activas; cada pecado muestra sus productos de ambas líneas con selector Origen/Singular.

## Riesgos
- PDP usa `imagenesPorColor` y color de hilo; en BD solo hay `imagenes` array. Definir cómo se almacenan imágenes por color (JSONB `imagenes_por_color`) o generar rutas por convención.
- Productos existentes en código no están en BD → sin seed, la galería quedará vacía.

## Validación
- Crear/editar producto en admin → aparece en galería del pecado y PDP.
- Cambiar colección → producto aparece en la galería correspondiente.
- Línea Singular requiere perfil (mantener gate).