# Plan: Sistema de Colecciones Dinámicas

## Objetivo
Reemplazar las colecciones hardcoded (PECADOS) por colecciones gestionadas desde la base de datos y el gestor de colecciones, con 3 modos de acceso, color, foto, descripción larga, lema, texto de botón y filtrado de productos por colección. El carrito mostrará la colección asociada.

## Estado actual (contexto)
- Tabla `colecciones`: `id`, `nombre`, `acento_color_hex`, `gema_principal`, `relato_poetico`, `activa`
- Tabla `productos`: tiene `coleccion_id`, `linea` (ORIGEN/SINGULAR), `activo`, `modo_acceso`
- Página inicio (`src/app/page.tsx`): usa `PECADOS` hardcoded de `src/lib/pecados.ts` para las cards
- Gestor colecciones (`src/app/admin/colecciones/page.tsx`): formulario básico (nombre, acento, gema, relato, activa)
- Ruta `coleccion/[slug]`: solo funciona bien para "soberbia", hace match por `nombre` ilike
- CartItem: no tiene campo de colección
- Storage bucket existente: `productos`

## Decisiones de diseño

1. **Slug de colección**: añadir columna `slug` (unique) a `colecciones` para URLs limpias (`/coleccion/<slug>`). Se genera del nombre si no se provee.
2. **Modo de acceso**: reemplazar/suplementar `activa` boolean por `modo_acceso` enum (`activa` | `proximamente` | `inactiva`). `activa=true` se deriva de `modo_acceso='activa'` para retrocompatibilidad.
3. **Foto de colección**: nuevo storage bucket `colecciones` (público), columna `foto_url`.
4. **Home page**: fetch de colecciones desde Supabase; solo renderiza `activa` y `proximamente`. `inactiva` no se muestra.
   - `activa`: card con link a `/coleccion/<slug>`, botón con `texto_boton`.
   - `proximamente`: card sin link al colección; al pulsar abre modal de lista de espera (email) asociado al slug.
   - `inactiva`: ocultada.
5. **Ruta colección genérica**: `coleccion/[slug]` funciona para cualquier colección activa; muestra `descripcion_larga` en el hero, dos pestañas/botones (Línea Origen / Línea Singular), filtra productos por `coleccion_id` y `linea`.
6. **Productos por colección**: el admin de productos ya asigna `coleccion_id`; la ruta de colección filtra por `coleccion_id`. El PDP sigue accesible por slug directo.
7. **Carrito**: `CartItem` agrega `coleccion?: string` (nombre); `CartDrawer` lo muestra bajo cada ítem.

## Tareas

### 1. Base de datos — migración SQL
- Archivo nuevo: `supabase/migrations/20261110000000_colecciones_extend.sql`
- Añadir a `colecciones`: `slug text unique`, `descripcion text`, `foto_url text`, `texto_boton text`, `descripcion_larga text`, `lema text`, `modo_acceso text` (default 'activa')
- Crear bucket storage `colecciones` con políticas RLS (lectura pública, escritura authenticated)
- Seed opcional: insertar las 7 colecciones pecados con slug, color, lema, descripcion_larga, texto_boton (para no perder contenido existente)

### 2. Tipos — `src/lib/types.ts`
- Añadir tipo `ModoColeccion = "activa" | "proximamente" | "inactiva"`
- Interfaz `Coleccion`: `id, nombre, slug, descripcion, foto_url, texto_boton, descripcion_larga, lema, acento_color_hex, modo_acceso`
- `CartItem`: agregar `coleccion?: string | null`
- Mantener `SolicitudEspera` (ya existe) para lista de espera de colección

### 3. Gestor de colecciones — `src/app/admin/colecciones/page.tsx`
- Formulario: nombre, foto (upload a bucket `colecciones`), descripcion (corta), texto_boton, descripcion_larga (textarea), lema, color hex (input color o texto), modo_acceso (select 3 opciones)
- Tabla: mostrar nombre, slug, color, modo, activa
- Guardar: insert/actualizar en `colecciones` + subir foto a storage

### 4. Página de inicio — `src/app/page.tsx`
- Quitar dependencia de `PECADOS` para cards; fetch `colecciones` desde Supabase
- Renderizar cards dinámicamente:
  - `card-media` con `foto_url` de la colección
  - `card-footer` badge con `texto_boton`
  - `activa`: `<Link href="/coleccion/{slug}">`
  - `proximamente`: sin link, onClick abre modal email (lista de espera por slug)
  - `inactiva`: no renderizar
- Mantener el modal de lista de espera existente, adaptado para colecciones

### 5. Ruta de colección genérica — `src/app/coleccion/[slug]/CollectionClient.tsx`
- Buscar colección por `slug` (fallback por nombre ilike)
- Hero: nombre, lema, descripcion_larga, color de acento
- Línea selector: 2 botones (Origen / Singular)
- Productos: filtrar por `coleccion_id` + `linea` seleccionada + `activo=true`

### 6. Carrito — `src/context/CartContext.tsx` + `src/components/cart/CartDrawer.tsx`
- `CartItem.coleccion?: string | null`
- Al agregar ítem (en PDP), incluir `coleccion` del producto (traer de DB o del contexto del producto)
- `CartDrawer`: renderizar `cart-item-coleccion` con el nombre de la colección bajo cada ítem

### 7. Validación
- `npm run lint`
- `npm run build`

## Riesgos y consideraciones
- La ruta existente `coleccion/soberbia` (SoberbiaClient) es hardcoded; conviene no romperla. Se puede dejar coexistiendo o migrar su contenido a la ruta genérica. Se deja como está para no romper funcionalidad existente.
- El matching actual de colección por `nombre` ilike es frágil; con `slug` se resuelve.
- Lista de espera de colección: reutilizar `SolicitudEspera` y `solicitarEspera` de `ProfileContext`, añadiendo `slug` de colección.
- Las 7 colecciones pecados ya creadas en BD pueden no tener `slug` ni los nuevos campos; el admin podrá completarlos.

## Criterios de aceptación
- [ ] Se crea una colección desde el gestor con nombre, foto, descripcion, texto_boton, descripcion_larga, lema, color hex y modo
- [ ] La card en inicio muestra la foto de la colección creada
- [ ] Modo activa: link a `/coleccion/<slug>` con el botón de entrada
- [ ] Modo proximamente: card visible, modal de email al pulsar
- [ ] Modo inactiva: no aparece en inicio
- [ ] Ruta `/coleccion/<slug>` muestra descripcion_larga y 2 líneas (Origen/Singular)
- [ ] Producto asignado a colección X solo aparece en la ruta de X
- [ ] Carrito muestra la colección asociada a cada ítem
- [ ] `npm run lint` y `npm run build` pasan sin errores
