# Plan: Sistema de Colecciones Dinámicas — Ajustes de UI/UX

## Estado actual (post-implementación inicial)
El sistema de colecciones dinámicas ya está implementado y commitado en `feature/pruebas-romany` (commit `081970d`). Build y lint pasan. Los archivos clave ya modificados:
- `supabase/migrations/20261110000000_colecciones_extend.sql`
- `src/lib/types.ts` (tipo `ModoColeccion`, interfaz `Coleccion`, `CartItem.coleccion`)
- `src/app/admin/colecciones/page.tsx` (gestor con foto, color, 3 modos)
- `src/app/page.tsx` (inicio con cards dinámicas desde Supabase)
- `src/app/coleccion/[slug]/CollectionClient.tsx` (ruta genérica con hero, líneas, productos)
- `src/components/cart/CartDrawer.tsx` (muestra colección por ítem)
- `src/app/producto/[slug]/page.tsx` (pasa colección al carrito)

## Nuevos cambios solicitados

### 1. Reducir tamaño de foto en el gestor de colecciones
**Archivo:** `src/app/admin/colecciones/page.tsx` (tabla, fila ~198-203)
**Problema:** `<img className="admin-coleccion-foto" />` se muestra con tamaño natural, tapando la usabilidad de la tabla.
**Solución:** Definir CSS `.admin-coleccion-foto` con tamaño mínimo (ej. `width: 32px; height: 32px; object-fit: cover; border-radius: 4px`) para que sea solo una referencia visual pequeña en la tabla de administración.

### 2. Título de la colección en negro en la ruta de colección
**Archivo:** `src/app/coleccion/[slug]/CollectionClient.tsx` (línea 75, 113)
**Problema:** `accentStyle` aplica `color: coleccion.acento_color_hex` al `<h1>`, y el usuario indica que el color no se usa; el título debe ser negro.
**Solución:** Eliminar `accentStyle` y no aplicar color al `<h1 className="collection-hero-title">`; dejar el color por defecto (negro / `--color-text`).

### 3. Borrar botón cta-btn de la ruta de colección
**Archivo:** `src/app/coleccion/[slug]/CollectionClient.tsx` (líneas 116-118)
**Problema:** El `<Link className="cta-btn">` con `texto_boton` aparece en la página de la colección, pero debe aparecer solo en la card de inicio.
**Solución:** Eliminar ese `<Link>` del hero de `CollectionClient.tsx`. El botón de entrada (`texto_boton`) se mantiene solo en la card de inicio (`page.tsx`).

### 4. Borrar imagen asociada de la ruta de colección
**Archivo:** `src/app/coleccion/[slug]/CollectionClient.tsx` (líneas 110-112)
**Problema:** `<Image src={coleccion.foto_url}>` aparece en la ruta de colección, pero esa imagen solo es para la card de inicio.
**Solución:** Eliminar el bloque `<Image>` del hero de `CollectionClient.tsx`. El hero mantiene título (negro), lema y descripción larga.

### 5. Selector "Colecciones" del inicio lleve a las colecciones disponibles
**Archivo:** `src/app/page.tsx` (línea 144, sección `collection-section`)
**Problema:** El `<h2 className="section-title">Colecciones</h2>` es solo texto estático; no navega a nada.
**Solución:** Convertir el título "Colecciones" en un `<Link>` clickeable que dirija a las colecciones disponibles creadas en el gestor. Dado que las cards ya están en la misma sección, el link debe envolver el título o navegar al listado de colecciones activas.

## Tareas pendientes (implementación)

- [ ] Tarea 1: CSS `.admin-coleccion-foto` tamaño mínimo en tabla admin
- [ ] Tarea 2: Quitar `accentStyle` del `<h1>` en `CollectionClient.tsx` (título negro)
- [ ] Tarea 3: Eliminar `<Link className="cta-btn">` del hero de `CollectionClient.tsx`
- [ ] Tarea 4: Eliminar `<Image src={coleccion.foto_url}>` del hero de `CollectionClient.tsx`
- [ ] Tarea 5: Convertir `<h2>Colecciones</h2>` en `<Link>` en `page.tsx`
- [ ] Tarea 6: `npm run lint` y `npm run build`

## Criterios de aceptación
- [ ] Foto en tabla admin pequeña (referencia, no tapa usabilidad)
- [ ] Título de colección en ruta se ve negro (sin color de acento)
- [ ] Ruta de colección no tiene botón cta-btn (solo en card de inicio)
- [ ] Ruta de colección no muestra imagen de colección (solo en card de inicio)
- [ ] Título "Colecciones" del inicio es un enlace a las colecciones disponibles
- [ ] `npm run lint` y `npm run build` pasan sin errores
