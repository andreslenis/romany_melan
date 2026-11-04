# Plan: Admin Productos - Imágenes y Variantes por Color

## Objetivo
Modificar el panel de administración de productos para:
1. Al editar un producto, mostrar las fotos actuales, permitir eliminarlas y subir otras (máximo 3 fotos por producto)
2. Permitir agregar variantes de colores de hilo por producto; si tiene variantes, seleccionar cuál y adjuntar foto por color (funciona al crear y al editar)

## Estado actual
- `src/app/admin/productos/page.tsx`: sube archivos nuevos y los agrega a `form.imagenes` (solo concatena, sin límite estricto de 3; sin eliminar existentes). No gestiona imágenes por color.
- `src/lib/types.ts`: `Producto.imagenesPorColor?: Record<string, string>`. En datos estáticos se usa para mostrar imagen según color seleccionado.
- `src/app/producto/[slug]/page.tsx` (PDP desde Supabase): carga producto desde BD, usa `imagenes` array y colores; al cambiar color, usa lógica basada en variantes del grupo (`variantes` por `grupo`) y también filtra por colores. También soporta `colores_hilo` en el producto.
- Schema Supabase (`productos`): `imagenes jsonb`, `colores_hilo jsonb`, `admite_color_hilo boolean`. No existe campo explícito para mapeo imagen-por-color en el schema visible.
- PDP muestra selector de colores para línea Origen (filtra colores que existan en variantes del grupo). Necesita poder mostrar imagen correspondiente al color seleccionado.

## Diseño propuesto

### 1) Almacenamiento de datos
Necesitamos guardar:
- **Imágenes generales**: mantener `imagenes` (array) con límite de 3. Al editar, poder quitar imágenes existentes.
- **Imágenes por color/variante**: agregar soporte para `imagenes_por_color` o `imagenesPorColor` como objeto `{ [colorId]: url }`. Esto permite que al seleccionar un color en PDP se muestre la foto correspondiente.

**Cambios en schema/DB:**
- Agregar columna `imagenes_por_color jsonb` a tabla `productos` (nullable). Opcionalmente también mantener compatibilidad con `imagenes`.

### 2) Admin - Gestión de imágenes (editar/crear)
**Cambios en `src/app/admin/productos/page.tsx`:**
- **Límite 3 fotos**: validar total (existentes + nuevas) <= 3. Mostrar contador.
- **Mostrar fotos actuales**: al editar (`editingId`), mostrar miniaturas de `form.imagenes` con botón "Eliminar".
- **Eliminar imagen**: quitar del array `form.imagenes` (no borra del storage por ahora, solo deja de asociarse).
- **Subir más**: permitir subir archivos, pero rechazar si excede 3. Deshabilitar input o mostrar aviso si ya hay 3.
- **UI**: sección "Imágenes del producto" con grid de miniaturas + botón eliminar, input para agregar.

### 3) Admin - Variantes por color de hilo
**Cambios en `src/app/admin/productos/page.tsx`:**
- Para línea `origen` (o cuando se desee), permitir definir variantes por color: mostrar lista de colores seleccionados en `form.coloresHilo` (ya existe parcialmente). Para cada color seleccionado, permitir subir/seleccionar una imagen específica para ese color (o asignar desde imágenes subidas).
- **Modelo de datos**: guardar `imagenes_por_color: Record<string, string>` mapeando `colorId` -> URL de imagen.
- **UI**: sección "Imágenes por variante de color" que aparece cuando hay colores seleccionados. Para cada color mostrar selector: usar imagen existente, subir nueva imagen para esta variante, o dejar sin imagen (fallback a imagen general).
- **Al guardar**: incluir `imagenes_por_color` en payload.

**Flujo:**
1. Usuario selecciona colores de hilo (checkboxes existentes).
2. Aparece sección por cada color con opción para asignar imagen (desde las subidas o nueva subida para esa variante).
3. Al guardar, se suben imágenes nuevas necesarias y se construye el mapeo.

### 4) PDP - Mostrar imagen por color (Supabase)
**Cambios en `src/app/producto/[slug]/page.tsx`:**
- Leer `imagenes_por_color` / `imagenesPorColor` del producto desde Supabase.
- Al cambiar `colorHilo`, si existe imagen para ese color en el mapeo, usarla como imagen principal/galería para esa variante.
- Mantener comportamiento actual (usar `imagenes` array como fallback).

## Tareas de implementación
1. **DB/Schema**: Agregar columna `imagenes_por_color jsonb` a `productos` (si no existe). Crear migración SQL.
2. **Admin tipos/form**: Extender `form` para incluir `imagenesPorColor: Record<string, string>`. Cargar al editar desde producto.
3. **Admin UI - Imágenes generales**: Mostrar miniaturas con eliminar, limitar a 3 totales, validar al subir.
4. **Admin UI - Imágenes por color**: Agregar sección condicional cuando hay colores seleccionados; permitir asignar/subir imagen por color.
5. **Admin guardar**: Subir imágenes necesarias, armar `imagenes_por_color`, guardar en payload.
6. **PDP**: Usar `imagenes_por_color` cuando esté disponible según color seleccionado.
7. **Validación**: Probar crear producto con 3 imágenes y variantes por color; editar y eliminar/agregar imágenes.

## Riesgos
- Compatibilidad con productos existentes (sin `imagenes_por_color`).
- Límites de storage/subida.
- UI compleja en admin - mantener clara.
- PDP debe seguir funcionando con datos estáticos y con Supabase.

## Criterios de aceptación
- Al editar producto aparecen fotos actuales, se pueden eliminar, se pueden agregar hasta llegar a 3 total.
- Al crear/editar con colores seleccionados se puede asignar foto por color; al cambiar color en PDP se muestra foto correspondiente.
- Funciona tanto al crear producto nuevo como al editar existente.
