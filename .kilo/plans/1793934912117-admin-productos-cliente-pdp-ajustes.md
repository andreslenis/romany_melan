# Plan: ajustes admin productos + PDP cliente

## Objetivo
Implementar los 3 cambios solicitados:
1. En `admin/productos`, retirar **Grupo / Familia (para variantes por color)** (no necesario).
2. Mostrar en cliente la **descripción corta** y la **narrativa/historia** del producto (campos cargados en admin) en PDP, en este orden:
   - Descripción corta debajo del nombre del producto.
   - Narrativa/historia en acordeón desplegable.
3. Si al registrar el producto **no se selecciona un color**, no mostrar selección/variantes de color al cliente; el color/imagen por color solo debe verse cuando **el color fue seleccionado y se cargó su foto**.

## Hallazgos (código actual)
- **Admin**: `src/app/admin/productos/page.tsx` — formulario/state incluye `grupo`, `descripcion_corta`, `historia` (→ `historia_narrativa`), `coloresHilo`, `imagenesPorColor`; valida que cada color Origen seleccionado tenga foto (`líneas ~92-98`); guarda `grupo`, `admite_color_hilo`, `colores_hilo`, `imagenesPorColor` (camelCase) + `imagenes`.
- **DB/schema**: `supabase/schema.sql` define `productos.grupo text` y `imagenes_por_color jsonb` (snake_case). No hay columna `colores_hilo` declarada en el schema base; el PDP ya tolera `imagenes_por_color`/`imagenesPorColor`. Cualquier cambio de columnas debe ser **aditivo/compatible** (migración nueva si se requiere); evitar romper datos existentes.
- **PDP cliente**: `src/app/producto/[slug]/page.tsx` carga desde Supabase; tipo `DBProd` no incluye `descripcion_corta`/`historia_narrativa`. Renderiza `producto.narrativa` (estático/tipo antiguo) al final (`líneas ~502-505`) y **no** muestra descripción corta bajo el nombre. Usa `grupo` para cargar `variantes` y lógica de `colores_hilo`; si no hay colores, cae a `COLORES_HILO` completo (`líneas ~369-372`) y fuerza `colorHilo` inicial a `soberbia` (`~47`), lo que contradice el requerimiento 3.
- **Tipos/data estáticos**: `src/lib/types.ts` usa `narrativa`; `src/data/productos.ts` poblado con `narrativa`. El PDP actual mezcla modelo Supabase/estático; cambios deben priorizar el flujo Supabase (admin) sin romper rutas que aún dependan de tipos.
- **Colecciones**: `CollectionClient`/`SoberbiaClient` no renderizan descripción corta/historia (fuera de alcance salvo que se detecte necesario).

## Plan de implementación (orden recomendado)

### 1) Admin: retirar Grupo / Familia
- `src/app/admin/productos/page.tsx`
  - Quitar `grupo` de `form` state, defaults/reset, `guardar` payload, `editar` mapeo y del JSX (label/input “Grupo / Familia…”).
  - Mantener `slug`/resto intacto.
- **Decisión de datos (compatible, recomendada)**: **no eliminar** columna `productos.grupo` en esta tarea; solo dejar de escribirla/mostrarla en UI. Esto evita migración destructiva y no afecta clientes que no dependan del campo. Si PDP depende de `grupo` para variantes, ver paso 3 para desacoplar.
- Validar que no haya otros usos activos en `src/` fuera de PDP/admin; planes/migrations históricas pueden permanecer.

### 2) PDP: descripción corta + narrativa (acordeón), orden correcto
- `src/app/producto/[slug]/page.tsx`
  - Extender `DBProd` con `descripcion_corta?: string; historia_narrativa?: string; narrativa?: string` (compatibilidad).
  - Derivar: `const descripcionCorta = (producto as any).descripcion_corta || ""; const historia = (producto as any).historia_narrativa || (producto as any).narrativa || "";` (normalizar con tipos seguros).
  - En `.pdp-header` (bajo `h1.pdp-title`): renderizar `descripcionCorta` **primero** (solo si existe), antes o en lugar apropiado respecto a `material`/precio según diseño actual; ubicar exactamente “debajo del nombre del producto”.
  - Mover/eliminar el bloque final `.pdp-narrative` fijo (`líneas ~502-505`) y reemplazar por un ítem de acordeón (reusar patrón `.pdp-accordion`/`details` existente) con summary tipo “Narrativa / Historia” (o el copy que encaje con la marca) que despliegue `historia`; renderizar solo si `historia` tiene contenido.
  - Asegurar que no se duplique la narrativa.
- `src/app/globals.css` (si hace falta): ajuste mínimo de espaciado para descripción corta bajo título (`.pdp-description`/clase existente coherente). No rediseñar.

### 3) Colores visibles al cliente solo si seleccionados + foto cargada
- **Regla de negocio a implementar (según pedido):** “no seleccionado → no mostrarlo del lado del cliente; solo hasta que sea seleccionado y se haya cargado la foto no debería poder verse”. Interpretación operativa: un color es visible/usable en PDP solo si está en la selección del producto **y** tiene imagen en `imagenesPorColor`/`imagenes_por_color`. (Si en datos existentes un color no tiene foto, no se muestra.)
- `src/app/admin/productos/page.tsx`
  - Mantener validación actual de “foto obligatoria por variante seleccionada” (ya existe) para garantizar consistencia futura.
  - Opcional defensivo: al guardar, persistir `colores_hilo`/selección coherente con colores que tienen foto (según modelo real de columnas); confirmar nombre de columna real antes de tocar (`imagenes_por_color` existe en schema base). No cambiar semántica que rompa productos existentes sin migración.
- `src/app/producto/[slug]/page.tsx`
  - Calcular **colores disponibles** como intersección: colores en `colores_hilo` (producto/variantes relevantes) **que tengan** `imagenes_por_color[colorId]` válido. No usar fallback a `COLORES_HILO` completo cuando el producto no define colores válidos con foto.
  - `useEffect` init: si hay colores disponibles, setear `colorHilo` al primero disponible; si **no** hay, `colorHilo` = `null`/vacío y no forzar `soberbia`.
  - Render: para línea Origen, mostrar bloque de color **solo si** `coloresDisponibles.length > 0`. Si no, ocultar swatches y texto de color seleccionado (o mostrar nada), manteniendo compra funcional si aplica.
  - `allImages`/imagen principal: si no hay color seleccionado válido, usar `imagenes` generales/`imagen` sin intentar forzar variante inexistente.
  - `handleAddToCart`: enviar `colorHilo: esSingular ? null : (colorHiloValido ? colorHilo : null)` y hex correspondiente; no enviar color fantasma.
- Revisar impacto en `variantes`/`grupo`: hoy PDP agrupa por `grupo`. Como se retira `grupo` del admin, productos nuevos no tendrán grupo; lógica debe seguir funcionando con `[prod]`/fallback actual (ya lo hace cuando no hay `grupo`). No introducir dependencia nueva en `grupo`.

### 4) Verificación / calidad
- `lsp_diagnostics` en archivos modificados.
- Ejecutar `npm run lint` y `npm run typecheck`/`tsc` si existen scripts (`package.json` tiene `lint`; confirmar `typecheck`). Si falla por issues preexistentes, reportar claramente.
- Prueba manual (cuando se implemente):
  - Admin: crear/editar sin colores → guarda; con color seleccionado exige foto.
  - PDP: producto sin colores válidos → sin selector de color; con descripción corta + historia → aparecen en orden correcto y acordeón funciona.
  - PDP: producto con color+foto → selector visible y cambia imagen.
- No commitear.

## Riesgos / notas
- Inconsistencia de nombres de columna/campo (`imagenesPorColor` camel vs `imagenes_por_color` snake, `colores_hilo` potencialmente no migrado en schema base): **leer ambos**, escribir el que la DB acepte hoy; preferir cambio mínimo. Si se detecta error de columna al guardar durante implementación, agregar migración aditiva en `supabase/migrations/` con timestamp coherente.
- Datos legacy con `grupo`/colores incompletos: no borrar; UI cliente debe ocultar colores inválidos.
- `src/lib/types.ts`/`src/data/productos.ts` usan `narrativa`; PDP debe tolerar ambos campos.

## Fuera de alcance
- Rediseño visual, cambios de copy no solicitados, migración destructiva de `grupo`, ajustes en checkout/pedidos salvo efecto colateral directo.
