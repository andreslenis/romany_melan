# Plan: Selector de variantes de color y foto por color

## Goal
En admin productos, permitir seleccionar variantes de color (colores de hilo) y cargar foto por cada color seleccionado. En cliente, al elegir color mostrar foto asociada (ya implementado parcialmente). Fotos iniciales solo con color original.

## Changes
1. `src/app/admin/productos/page.tsx`: agregar selector de checkboxes de `COLORES_HILO` (solo línea origen) que actualice `form.coloresHilo`. La sección "Imágenes por variante de color" ya existe y se activa cuando hay colores seleccionados; exige subir foto por color. Validar que cada color seleccionado tenga foto al guardar (o marcar pendiente).

2. Admin: al guardar, asegurar `imagenes_por_color` solo incluye colores seleccionados; limpiar huérfanos.

3. Cliente `src/app/producto/[slug]/page.tsx`: `allImages` ya prioriza `imagenes_por_color[colorHilo]`. Verificar que fotos iniciales (imagenes) correspondan al color original; si no hay foto por color, caer a imagenes. Ya hecho.

## Validation
- Lint/typecheck.
- Manual: crear producto origen, seleccionar colores, subir fotos, verificar cliente cambia foto al cambiar color.