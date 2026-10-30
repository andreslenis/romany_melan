# Plan: PDP desde BD con variantes por color (1–3 fotos)

## Contexto
- PDP (`src/app/producto/[slug]/page.tsx`) usa datos hardcoded de `src/data/productos.ts`.
- Admin ya guarda productos en BD con `coleccion_id`, `linea`, `imagenes[]`, `colores_hilo[]` y `admite_color_hilo`.
- Nuevo requerimiento: cada producto se guarda con **un solo color de hilo** y 1–3 fotos de ese color. El mismo diseño puede repetirse con otro color. Al seleccionar color en el PDP se deben mostrar las fotos de esa variante.

## Decisiones
- Agrupación por campo `grupo` (texto) compartido entre variantes del mismo diseño.
- Nombre base común; el color se muestra como variante.
- PDP carga todas las variantes del grupo en una sola consulta y cambia fotos en cliente.

## Cambios

### 1. Esquema
- Agregar `grupo text` a `productos` (y opcionalmente índice).
- Migrar/seed: asignar `grupo` a productos existentes.

### 2. Admin productos
- Agregar campo `grupo` al formulario y al payload.
- Cambiar selección de color: un solo color por producto (`color_hilo` singular) en lugar de `colores_hilo[]` múltiple. Guardar `colores_hilo` con un solo elemento (o nueva columna `color_hilo`).
- Validar 1–3 imágenes por producto.
- Editar: cargar `grupo` y color actual.

### 3. PDP
- Obtener producto por `slug` desde BD.
- Obtener todas las variantes con el mismo `grupo`.
- Construir selector de color solo con colores que tienen variante.
- Al seleccionar color, mostrar `imagenes` de la variante correspondiente.
- "También te puede gustar" desde la misma colección (BD).
- Eliminar dependencia de `src/data/productos.ts`.

### 4. Galería
- Sin cambios mayores; ya lee de BD.

## Riesgos
- Productos existentes sin `grupo` no se agruparán; requiere migración manual.
- Compatibilidad con `colores_hilo[]` actual; decidir si mantener o reemplazar.

## Validación
- Crear 2 variantes del mismo diseño con colores distintos y 2–3 fotos cada una.
- En PDP seleccionar color → fotos cambian.
- Nuevo producto aparece en galería y PDP.