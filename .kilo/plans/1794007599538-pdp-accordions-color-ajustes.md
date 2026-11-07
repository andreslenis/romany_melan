# Plan: Ajustes PDP producto (acordeones, color, textos, imágenes)

## Objetivo
1. Mostrar acordeón **Narrativa / Historia** debajo de la descripción corta; **no** mostrarlo en el bloque inferior.
2. Hacer visible/funcional el selector de variaciones de color según datos guardados.
3. Cambiar texto de **CUIDA TUS JOYAS**.
4. Reemplazar fotos de **Cómo medir tu muñeca** por las de `resources/referencias`.
5. Agregar acordeón **Cómo saber tu talla de anillo** (texto + tabla + imagen), igual estilo que “Cuida tus joyas”.

## Decisiones confirmadas
- Narrativa/Historia: ubicada justo bajo la descripción corta (`.pdp-header`), **eliminada** del grupo de acordiones inferior. (confirmado por usuario)

## Contexto relevante
- PDP: `src/app/producto/[slug]/page.tsx` (client). Descripción corta en `:372`; historia derivada de `descripcion_corta`/`historia_narrativa`/`narrativa` (`:150-155`); acordeón inferior en `:522-556` (historia duplicada en `:547-555`); “Cuida tus joyas” en `:525-528`; “Cómo medir tu muñeca” en `:531-545` con `/resources/como_medir/paso1-3.jpg` (no presentes en `public/`).
- Selector color: `coloresDisponibles`/`coloresConFoto`/`getImgsPorColor` (`:40-55`, `:195-205`), render `:413-433`. Se muestra solo si Origen no-Singular y hay colores **seleccionados con foto** (`imagenes_por_color`/`imagenesPorColor`). Colores base en `src/lib/pecados.ts` (`COLORES_HILO`).
- CSS acordeón/swatches/tabla: `src/app/globals.css` (`.pdp-accordion*` ~1094-1152, `.color-swatch*`/`.pdp-color-*` ~2496-2553).
- Referencias fuente: `resources/referencias/paso_1_mano.jpg`, `paso_2_mano.jpg`, `paso_3_,mano.jpg` (coma en nombre), `paso_anillos.jpg`. `public/` no tiene `como_medir/`.

## Plan de implementación

### 1) Assets públicos
- Copiar/normalizar a rutas servibles bajo `public/`:
  - `resources/referencias/paso_1_mano.jpg` → `public/resources/como_medir/paso_1_mano.jpg`
  - `resources/referencias/paso_2_mano.jpg` → `public/resources/como_medir/paso_2_mano.jpg`
  - `resources/referencias/paso_3_,mano.jpg` → `public/resources/como_medir/paso_3_mano.jpg` (normalizar nombre)
  - `resources/referencias/paso_anillos.jpg` → `public/resources/como_medir/paso_anillos.jpg`
- Verificar existencia/legibilidad de destinos.

### 2) Narrativa/Historia bajo descripción corta (solo ahí)
- En `src/app/producto/[slug]/page.tsx`, dentro de `.pdp-header`, después de `{descripcionCorta && <p className="pdp-description">...}` (`~372`), renderizar condicionalmente (si `historia`) un acordeón:
  - `<div className="pdp-accordion"><div className="pdp-accordion-item"><details><summary>NARRATIVA / HISTORIA</summary><div className="pdp-accordion-content"><p>{historia}</p></div></details></div></div>`
- Eliminar el ítem `{historia && (...)}` del acordeón inferior (`:547-555`) para evitar duplicado.
- No cambiar derivación `descripcionCorta`/`historia`.

### 3) Selector de colores visible/funcional
- Endurecer parsing en PDP (sin tocar admin salvo necesidad no prevista):
  - `getImgsPorColor`: normalizar claves a `string`; ignorar valores no-string/vacíos.
  - Parsear `colores_hilo` de forma tolerante (array de strings, string simple, o JSON stringificado con array) → lista de IDs.
  - `coloresDisponibles`: para línea activa Origen, tomar IDs seleccionados que tengan imagen válida **y** existan en `COLORES_HILO` (o, si se prefiere flexibilidad, permitir IDs desconocidos con swatch fallback); ordenar por `COLORES_HILO`.
  - Revisar `variantes`/producto activo: incluir producto actual + variantes de la misma línea/grupo relevante sin depender rígidamente de `grupo` ausente.
- Estado/efectos:
  - Al cargar datos o cambiar `lineaActiva`/producto, si `colorHilo` no está en `coloresDisponibles` y hay disponibles, setear al primero; si no hay, `colorHilo = null`. No forzar `soberbia`.
  - `colorActivoValido` solo si tiene foto; imagen principal/galería/carrito ya dependen de esto — conservar coherencia.
- Render: mantener condición actual (`!esSingular && coloresDisponibles.length > 0`) y swatches con `onClick={() => setColorHilo(opcion.id)}`. Asegurar que no queda oculto por CSS (revisar contenedor; agregar regla mínima solo si se detecta colapso/overflow real).
- Regla de negocio preservada: si no hay colores seleccionados+foto guardados, el selector no se muestra (dato a corregir en admin). No inventar colores.

### 4) Texto “CUIDA TUS JOYAS”
- `src/app/producto/[slug]/page.tsx` (`:527`): reemplazar contenido por:
  `Desde Romany Melan te aconsejamos que hagas un uso adecuado de tus joyas. Son productos que aunque sean duraderos han de ser almacenados de forma independiente evitando el roce y a ser posible en bolsas individuales. No uses productos abrasivos para su limpieza. Recuerda tratarlas con cariño y mimo.`

### 5) Fotos “Cómo medir tu muñeca”
- Actualizar `src/app/producto/[slug]/page.tsx` (`:539-541`) a:
  - `/resources/como_medir/paso_1_mano.jpg`
  - `/resources/como_medir/paso_2_mano.jpg`
  - `/resources/como_medir/paso_3_mano.jpg`
- Mantener `alt` descriptivos; conservar texto de pasos.

### 6) Acordeón “Cómo saber tu talla de anillo”
- En el bloque inferior `.pdp-accordion` (junto a “Cuida tus joyas”), agregar `.pdp-accordion-item` con:
  - `summary`: `COMO SABER TU TALLA DE ANILLO`
  - Pasos (texto exacto solicitado):
    1. Recortamos una tira de papel o un trozo de cordel.
    2. Lo colocamos alrededor de nuestro dedo como si fuera un anillo.
    3. Realizamos una marca en los extremos del circulo de papel
    4. Medimos la distancia en milímetros y buscamos nuestra talla de anillo en la tabla
  - Tabla MEDIDA/TALLA con filas: 46.8mm→4, 46.8mm→4’5, 49.3→5, 50.6→5’5, 51.8→6, 51.8→6’5, 54.3→7, 55.6→7’5, 56.9→8, 56.9→8’5, 59.4→9, 60.9→9’5, 62.2→10, 63.5→10’5, 64.7→11, 66.0→11’5, 67.2→12, 67.2→12’5, 69.7→13, 71.0→13’5, 72.3→14. Normalizar espacios accidentales; **no alterar valores**.
  - Imagen `paso_anillos`: `<Image src="/resources/como_medir/paso_anillos.jpg" alt="Cómo medir tu talla de anillo" .../>` dentro de `.pdp-accordion-images` (misma presentación que “Cuida tus joyas”/muñeca).
- `src/app/globals.css`: estilos mínimos para tabla dentro de acordeón (ej. `.pdp-accordion-content table`, `.pdp-size-table`), bordes suaves, padding, tipografía coherente, responsive simple. Sin rediseño global.

## Archivos a modificar
- `src/app/producto/[slug]/page.tsx`
- `src/app/globals.css` (solo estilos tabla/ajustes mínimos si necesarios)
- `public/resources/como_medir/*` (nuevos assets copiados)

## Riesgos / notas
- Selector ausente por **datos** (sin `colores_hilo`/fotos válidas en DB): el endurecimiento ayuda con formatos, pero no crea datos. Validar con un producto que tenga variaciones guardadas.
- `imagenesPorColor` camelCase vs `imagenes_por_color` snake_case y tipos mixtos: leer ambos.
- Normalizar nombre fuente `paso_3_,mano.jpg` al copiar.
- Mantener compatibilidad con `narrativa` legacy.

## Verificación
- `lsp_diagnostics` en `src/app/producto/[slug]/page.tsx` y `src/app/globals.css`.
- `npm run lint`; `npx tsc --noEmit` (o script typecheck si existe). Separar fallos preexistentes.
- Manual PDP: (a) con historia → acordeón bajo descripción corta, ausente abajo; (b) producto Origen con colores+foto → swatches visibles y cambian imagen/carrito; (c) texto “Cuida tus joyas” actualizado; (d) muñeca muestra 3 fotos nuevas; (e) acordeón “Cómo saber tu talla de anillo” muestra pasos, tabla completa e imagen `paso_anillos`.
- No commitear.
