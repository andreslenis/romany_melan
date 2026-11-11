# Plan: Ajustes UI/UX - Romany Melan

## Resumen de Cambios Solicitados

1. **Botones compartir (PDP)**: WhatsApp y Copiar enlace siempre visibles, layout vertical (nombre arriba, icono abajo), tamaño considerable, solo WhatsApp (verde) y Copiar enlace (color), eliminar Instagram
2. **Precio producto**: Más llamativo visualmente
3. **Selector talla**: Dropdown/select para ocupar menos espacio
4. **Nombre producto**: Más llamativo, diferenciar de descripción
5. **Página Autora**: Agregar fotos de carpeta autora, frase específica, texto biográfico, lema junto a foto 2
6. **Mobile header**: Menú hamburguesa con "Inicio" y "La Autora"
7. **Línea Singular en colecciones**: Funcionar igual que Soberbia (solo logueados, filtrar por colección)

---

## Análisis por Requerimiento

### 1. Botones Compartir PDP - Rediseño

**Estado actual**: Dropdown con 3 opciones (WhatsApp, Copiar, Instagram), icono pequeño
**Cambio**: 
- Siempre visible (no dropdown)
- Layout: Texto arriba, icono abajo
- Tamaño considerable
- Solo 2 botones: WhatsApp (verde #25D366) y Copiar enlace (color accent #D4AF37)
- Eliminar Instagram

**Archivos**: `src/app/producto/[slug]/page.tsx` + `src/app/globals.css`

---

### 2. Precio Producto - Más Llamativo

**Estado actual**: `.pdp-price` con `font-size: clamp(1.25rem, 3vw, 1.5rem)`
**Cambio**: 
- Aumentar tamaño, peso, color accent
- Posiblemente agregar etiqueta "COP" más visible

**Archivos**: `src/app/globals.css` (`.pdp-price`)

---

### 3. Selector Talla - Dropdown/Select

**Estado actual**: Botones horizontales `.pdp-size-btn`
**Cambio**: `<select>` nativo o dropdown estilizado
- Ocupa menos espacio
- Mobile-friendly

**Archivos**: `src/app/producto/[slug]/page.tsx` + `src/app/globals.css`

---

### 4. Nombre Producto - Más Llamativo

**Estado actual**: `.pdp-title` con `font-size: clamp(2rem, 6vw, 3.25rem)`
**Cambio**:
- Aumentar tamaño/peso
- Mejor separación visual de `.pdp-description`
- Posiblemente color accent o línea divisoria

**Archivos**: `src/app/globals.css` (`.pdp-title`, `.pdp-header`, `.pdp-description`)

---

### 5. Página Autora - Contenido e Imágenes

**Imágenes disponibles**:
- `/resources/autora/melany_roman.jpg` (foto principal)
- `/resources/autora/Perfil_autora.jpg` (foto 2/perfil)

**Cambios**:
1. Agregar frase: "Crear no es un oficio rápido; es el acto consciente de detener el tiempo y entrelazar hileras de paciencia en cada joya."
2. Sección "Sobre Melany Roman" con texto biográfico completo proporcionado
3. Junto a foto 2 (Perfil_autora): agregar lema
4. Usar ambas imágenes en layout

**Archivos**: `src/app/autora/page.tsx` + `src/app/globals.css`

---

### 6. Mobile Header - Menú Hamburguesa

**Estado actual**: Header muestra links solo en desktop (`.nav-links` con `display: none` mobile)
**Cambio**:
- Botón hamburguesa en mobile
- Menú lateral/dropdown con: Inicio, La Autora, (Colecciones si aplica)
- Cerrar al click fuera o seleccionar link

**Archivos**: `src/components/SiteHeader.tsx` + `src/app/globals.css`

---

### 7. Línea Singular en Colecciones Genéricas

**Estado actual**: `CollectionClient.tsx` muestra botón "Línea Singular" sin validación de sesión
**Cambio**: 
- Replicar lógica de `SoberbiaClient.tsx`: `singularLocked` state, verificar `perfil` + `hydrated`
- Filtrar productos por `coleccion_id` (ya hace esto)
- Solo mostrar productos Singular si usuario logueado

**Archivos**: `src/app/coleccion/[slug]/CollectionClient.tsx`

---

## Plan de Ejecución

### Fase 1: PDP - Compartir, Precio, Talla, Nombre
- [ ] 1.1 Rediseñar botones compartir (siempre visibles, 2 botones, layout vertical)
- [ ] 1.2 Mejorar estilo precio (`.pdp-price`)
- [ ] 1.3 Cambiar talla a select/dropdown
- [ ] 1.4 Mejorar nombre producto (`.pdp-title`, separación descripción)

### Fase 2: Página Autora
- [ ] 2.1 Agregar imágenes melany_roman.jpg y Perfil_autora.jpg
- [ ] 2.2 Agregar frase "Crear no es un oficio rápido..."
- [ ] 2.3 Actualizar sección "Sobre Melany Roman" con texto biográfico
- [ ] 2.4 Agregar lema junto a foto 2

### Fase 3: Mobile Header
- [ ] 3.1 Agregar estado `mobileMenuOpen` en SiteHeader
- [ ] 3.2 Botón hamburguesa (visible mobile)
- [ ] 3.3 Panel menú con links: Inicio, La Autora
- [ ] 3.4 Estilos CSS para menú mobile

### Fase 4: Colecciones - Línea Singular
- [ ] 4.1 Replicar lógica `singularLocked` en CollectionClient
- [ ] 4.2 Verificar `perfil` + `hydrated` antes de mostrar Singular
- [ ] 4.3 Mostrar gate/login si intenta acceder sin sesión

### Fase 5: Validación
- [ ] `npm run lint` y `npm run build` exitosos
- [ ] Probar mobile/desktop
- [ ] Verificar flujo compartir, talla, precio, nombre
- [ ] Verificar página autora con imágenes y textos
- [ ] Verificar menú hamburguesa mobile
- [ ] Verificar línea singular en colecciones genéricas

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/app/producto/[slug]/page.tsx` | Compartir, talla (select), imports |
| `src/app/globals.css` | `.pdp-share`, `.pdp-price`, `.pdp-title`, `.pdp-size-options`, `.pdp-header`, mobile header, autora |
| `src/app/autora/page.tsx` | Contenido completo, imágenes, textos |
| `src/components/SiteHeader.tsx` | Menú hamburguesa mobile |
| `src/app/coleccion/[slug]/CollectionClient.tsx` | Lógica singularLocked |

---

## Riesgos y Consideraciones

1. **Select nativo vs custom**: `<select>` nativo es más accesible pero menos estilizable. Considerar dropdown custom si diseño lo requiere.
2. **Mobile header**: No romper desktop nav. Usar `lg:` breakpoints.
3. **Imágenes autora**: Verificar rutas correctas (`/resources/autora/...`)
4. **Colecciones**: `CollectionClient` ya filtra por `coleccion_id`, solo faltar gate de Singular.
5. **CSS sharing**: Los botones compartir en PDP usan estilos inline + CSS. Mover a CSS para mantenibilidad.

---

## Validación Final

- [ ] Build sin errores
- [ ] Lint sin errores nuevos
- [ ] Mobile: header hamburguesa funciona, PDP botones visibles
- [ ] Desktop: PDP layout correcto, precio llamativo, select talla
- [ ] Autora: imágenes cargan, textos correctos, layout responsive
- [ ] Colecciones: Singular bloqueado sin login, gate funciona