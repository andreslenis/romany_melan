# Plan: SEO on-page para Romany Melan (SSR/SSG, metadatos, favicon, sitemap)

## Contexto y alcance

Romany Melan (Next.js 15 App Router, `src/app`) renderiza hoy **100% en cliente** la home (`src/app/page.tsx`) y las páginas de colección (`src/app/coleccion/[slug]/CollectionClient.tsx` y `src/app/coleccion/soberbia/SoberbiaClient.tsx`). El contenido de producto/colección se carga en `useEffect` → Googlebot ve "Cargando colecciones…". Este plan lleva ese contenido al HTML inicial, ajusta metadatos globales/per-página, migra el favicon y añade sitemap/robots.

### Decisiones ya resueltas (por el usuario)
- **URLs de producto**: se mantiene `/producto/[slug]` (NO se cambia a `/coleccion/[pecado]/[producto]`). Las peticiones de "URLs amigables" del punto 4 se satisfacen con la estructura existente + metadatos dinámicos + alt descriptivo.
- **Ruta canónica de Soberbia**: se unifica en `src/app/coleccion/[slug]/` y se **elimina** el estático `src/app/coleccion/soberbia/`. El home ya enlaza a `/coleccion/${c.slug}`, y `SoberbiaClient` y `[slug]` son funcionalmente equivalentes (ambos leen productos de Supabase), por lo que el contenido se preserva vía datos.

### Hallazgo bloqueante a resolver
- La tabla `colecciones` tiene RLS activo con **solo** política `auth_all_colecciones` (rol `authenticated`) en `schema.sql:92`. El rol `anon` **no tiene SELECT**. El SSR/SSG usa la anon key (sin sesión), por lo que hay que **añadir política `anon` de solo lectura** sobre `colecciones`. Sin esto, cualquier fetch server-side devolvería vacío.

---

## Tareas

### 1. Migración RLS: permitir lectura pública de colecciones
**Archivo:** `supabase/migrations/20261115000000_colecciones_anon_select.sql` (nuevo)
- `CREATE POLICY "anon_read_colecciones" ON public.colecciones FOR SELECT TO anon USING (true);`
- Idempotente (`DROP POLICY IF EXISTS` + `CREATE`, o `DO $$ ... exception when duplicate_object`).
- Nota: `productos` ya tiene `anon_all_productos` (`schema.sql:94`), no requiere cambios.

### 2. Favicon desde `resources/icons/icon.png`
- Copiar `resources/icons/icon.png` → `src/app/icon.png` (Next genera `<link rel="icon" type="image/png" sizes="NxN">` automáticamente).
- Eliminar `src/app/favicon.ico` (el `.ico` quedaría como fallback; el `icon.png` lo sustituye).
- Opcional recomendado: añadir `apple-icon.png` y `icon.svg` si se quiere cobertura iOS/PWA; fuera de alcance mínimo del usuario salvo que lo pida.

### 3. Metadatos globales (`src/app/layout.tsx`)
- `metadata.title` → `"Romany Melan | Joyería de Autor en Colombia con Piedras Naturales"`
- `metadata.description` → `"Joyería artesanal de autor en Colombia. Descubre piezas únicas hechas a mano con micro macramé, metales nobles como oro y plata, y minerales naturales."`
- Añadir `metadataBase: new URL("https://www.romanymelan.com")` (dominio canónico confirmado vía email/SEO actual). Esto habilita OG/canonical absolutos.
- Mantener `<html lang="es">`.
- Opcional: `alternates.canonical: "/"` a nivel layout (si no se sobreescribe en páginas hijas).

### 4. Home SSR/SSG (`src/app/page.tsx`)
- Convertir el **fetch de colecciones** a servidor: el componente `Home` deja de ser `"use client"` para la carga de datos. Estrategia:
  - `export const revalidate = 3600` (ISR) — una hora; o `dynamic = "force-static"` con `revalidate`.
  - Crear `src/lib/supabase/server.ts` `createClientServer()` (ya existe, usa anon key) y consultar:
    - `colecciones` con `.eq("modo_acceso", ...)` / filtro `!== "inactiva"`, `.order("nombre")`.
  - Pasar `colecciones` como prop a un **client component** `HomeClient` que conserva el modal de "próximamente" (estado/`usePerfil`), IntersectionObserver, etc.
- `src/components/home/HomeClient.tsx` (nuevo): recibe `colecciones: Coleccion[]`. Elimina el `useEffect` de fetch y el estado `loading` (ya no aplica).
- **Encabezados SEO** (punto 3):
  - `<h1>` del hero: actualmente `"ROMANY MELAN"` → cambiar a **`"Romany Melan | Joyería de Autor en Colombia con Piedras Naturales"`** (mantener clases/estilo `hero-title`).
  - Añadir `<h2>` principal (bajo el h1 o como subtítulo del hero) con el texto solicitado: **`"Historias tejidas a mano en micro macramé, metales nobles y mineralogía ancestral."`** (usar `section-subtitle` o nuevo `hero-h2`). Nota: ya existe un `<h3 class="section-subtitle">— EL ORIGEN Y LA MATERIA</h3>`; reubicar/renombrar para no duplicar jerarquía sin sentido.
  - El `<h2 class="section-title">La Autora & El Origen</h2>` de la sección autora puede conservarse (no es el H2 principal de SEO, pero es válido).
- Imágenes: añadir `alt` descriptivo a `isotipo.png` (ya tiene "Romany Melan") y a `melany_roman.jpg` (ya tiene alt) — revisar que el alt del hero isotipo sea keyword-rich: `alt="Isotipo Romany Melan · Joyería de autor"` (opcional, bajo riesgo).

### 5. Página de colección SSR/SSG (`src/app/coleccion/[slug]/`)
- `page.tsx`: convertir a **async server component**:
  - `params: Promise<{slug:string}>`, `const { slug } = await params`.
  - Consultar `colecciones` por `slug` (con fallback por nombre, como ya hace el cliente).
  - Consultar `productos` por `coleccion_id` + `activo=true` + `order(nombre)`.
  - `generateMetadata({params})` → `title: "{Colección} | Colección {Nombre} | Romany Melan"`, `description` desde `descripcion_larga`/`lema`.
  - `notFound()` si no existe colección.
  - Pasar `coleccion`, `productos`, `slug` a `CollectionClient` (cliente) que conserva: selector línea Origen/Singular, orden, gating "Singular" (perfil), render de tarjetas.
- `CollectionClient.tsx`: eliminar `useEffect` de carga, `loading`, y el estado `coleccion`/`productos` locales; recibirlos por props. Mantener orden y gating.
- **Alt de imágenes de producto** (punto 4): en el render de tarjetas, el `alt` pasa de `p.nombre` a descriptivo keyword-rich. Propuesta de helper en `src/lib/seo.ts`:
  - `altProducto(nombre, {piedra, material, coleccion})` → `"${nombre} · ${coleccion} · ${material} · Romany Melan"` con fallback a `nombre` si faltan campos.
- `generateStaticParams`: opcional si se quiere SSG puro de colecciones activas; con `revalidate` (ISR) es suficiente y cubre colecciones creadas tras el build. Recomendado `revalidate = 3600` + `dynamicParams = true`.

### 6. Eliminar estático `soberbia/`
- Borrar `src/app/coleccion/soberbia/` (`page.tsx` + `SoberbiaClient.tsx`).
- Verificar que `/coleccion/soberbia` resuelve vía `[slug]` (slug seeded = `soberbia` en migración `20261110000000`). El contenido (hero, lema, descripción) sale de Supabase.
- Confirmar que el home sigue enlazando a `/coleccion/${c.slug}` (ya lo hace).

### 7. PDP producto metadatos dinámicos + alt (`src/app/producto/[slug]/`)
- **Problema**: el archivo es `"use client"` completo; `generateMetadata` **no** puede exportarse desde un client component. Hay que dividir:
  - `src/app/producto/[slug]/page.tsx` → **server component** async: `const { slug } = await params`, consulta `productos` por slug (+ `coleccion_id`→`colecciones.nombre`), llama `generateMetadata` y renderiza `<ProductoClient producto={...} variants={...} coleccionNombre={...} />`.
  - `src/app/producto/[slug]/ProductoClient.tsx` (nuevo, "use client"): el cuerpo actual (galería, colores, tallas, carrito, waitlist, zoom, accordions, `useParams`/`use` eliminado). Recibe datos por props; conserva toda la lógica interactiva (carrito, perfil, share).
- `generateMetadata`:
  - `title`: `${producto.nombre} Colección ${coleccionNombre} | Romany Melan` (ej. "Collar Amatista Colección Soberbia | Romany Melan"). Si no hay colección, `${nombre} | Romany Melan`.
  - `description`: `descripcion_corta` || `historia_narrativa` || fallback marca.
  - `alternates.canonical`: `/producto/${slug}`.
  - OG tags opcionales (title/description/images) — recomendado.
- **Alt de imágenes** (punto 4): en `ProductoClient`, las `<Image>` del PDP (principal, miniaturas, zoom) usan `alt` descriptivo: helper `altProducto(nombre, material/piedra, coleccion)` → ej. `"Collar Amatista trenzado a mano en micro macramé, colección Soberbia · Romany Melan"`. Mantener `alt` existentes de "paso 1/2/3" (son instructivos, no producto).
- `generateStaticParams`: opcional; con ISR `revalidate=3600` + `dynamicParams=true` cubre productos nuevos. Recomendado ISR.

### 8. Sitemap + robots (punto 5)
- **Opción A (recomendada, sin dependencias nuevas)**: `src/app/sitemap.ts` (Next Metadata API):
  - `export default async function sitemap(): Promise<MetadataRoute.Sitemap>`.
  - Base `https://www.romanymelan.com`.
  - Home `/` (priority 1.0).
  - Colecciones activas: query `colecciones` (modo_acceso != inactiva) → `/coleccion/${slug}`.
  - Productos activos: query `productos` (activo=true) → `/producto/${slug}`.
  - `lastModified` desde `updated_at` si existe; `changeFrequency` semanal/mensual.
- `src/app/robots.ts`: `allow: "/"`, `disallow: ["/admin", "/api", "/checkout", "/mi-perfil", "/crear-perfil", "/inicio-sesion"]`, `sitemap: "https://www.romanymelan.com/sitemap.xml"`.
- Nota: si el usuario prefiere `next-sitemap`, es alternativa; pero Metadata API es nativa y coherente con el resto del plan.

### 9. Verificación
- `npm run build` (Next 15) y `npm run lint`.
- Comprobar HTML inicial (curl/`view-source`) de `/`, `/coleccion/soberbia`, `/producto/<slug>`: debe contener nombre, precio, descripción sin ejecutar JS.
- Validar `/sitemap.xml` y `/robots.txt` responden 200.
- Validar metadatos por producto (title dinámico) y alt de imágenes.

---

## Archivos afectados (resumen)

| Archivo | Acción |
|---|---|
| `supabase/migrations/20261115000000_colecciones_anon_select.sql` | nuevo (RLS anon SELECT) |
| `src/app/icon.png` | nuevo (desde resources/icons/icon.png) |
| `src/app/favicon.ico` | eliminar |
| `src/app/layout.tsx` | title/description/metadataBase |
| `src/app/page.tsx` | server: fetch colecciones, H1/H2, render HomeClient |
| `src/components/home/HomeClient.tsx` | nuevo (cliente: modal, observer) |
| `src/app/coleccion/[slug]/page.tsx` | async server: fetch + generateMetadata |
| `src/app/coleccion/[slug]/CollectionClient.tsx` | props en vez de fetch |
| `src/app/coleccion/soberbia/` | eliminar |
| `src/app/producto/[slug]/page.tsx` | server: fetch + generateMetadata |
| `src/app/producto/[slug]/ProductoClient.tsx` | nuevo (cliente: cuerpo actual) |
| `src/lib/seo.ts` | nuevo helper `altProducto` |
| `src/app/sitemap.ts` | nuevo |
| `src/app/robots.ts` | nuevo |

## Riesgos / notas
- **RLS**: sin la migración del paso 1, el SSR no obtiene colecciones. Es prerrequisito.
- **División server/client** en `page.tsx` y `producto/[slug]/page.tsx`: mover estado a client components preserva interactividad; verificar que `usePerfil`/`useCart` siguen disponibles (viven en providers del layout).
- **ISR vs SSG**: se elige ISR (`revalidate=3600`) para que colecciones/productos nuevos aparezcan sin redeploy; `dynamicParams=true` evita 404 en rutas nuevas.
- **Dominio canónico**: `https://www.romanymelan.com` (confirmado por emails y enlaces actuales). Ajustar si el dominio real difiere.