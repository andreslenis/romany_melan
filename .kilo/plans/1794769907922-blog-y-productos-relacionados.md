# Plan: Productos relacionados + Blog SEO (artículos Markdown)

## Contexto

Dos features independientes en el e-commerce Romany Melan (Next.js 15 App Router):

1. **Productos relacionados**: al abrir una ficha, mostrar **exactamente 2** productos del inventario para promocionar venta cruzada.
2. **Blog**: índice `/blog` + ruta dinámica `/blog/[slug]`, renderizado desde Markdown con SEO (title/meta dinámicos), subtítulos H2/H3 y bloques CTA hacia colecciones.

Estado actual relevante:
- `src/app/producto/[slug]/page.tsx` ya es server component (ISR 3600s) y pasa props a `ProductoClient` (cliente). La ficha renderiza `SiteHeader` + `<main>` + `SiteFooter` dentro de `ProductoClient`.
- `src/lib/supabase/queries.ts` centraliza consultas (patrón `try/catch` + `console.error` + fallback `[]`).
- Tabla `productos`: `activo`, `stock_disponible` (int), `modo_acceso` (text), `linea` (`ORIGEN`/`SINGULAR`), `grupo`, `coleccion_id`.
- No hay dependencias de Markdown/MDX. `next.config.ts` solo configura `images.remotePatterns` para Supabase.
- `SiteHeader` tiene `ENLACES_DESKTOP = [Inicio, La Autora]` (se usa para desktop y móvil).
- `globals.css` ya tiene `.products-grid`, `.product-card`, `.cta-btn`, `.container`.

## Decisiones tomadas (confirmadas)

1. **Relacionados**: `activo=true` + `stock_disponible>0` + `modo_acceso='disponible'`; excluir el producto actual y las variantes del mismo `grupo`; preferir misma colección y completar con otros; si hay menos de 2, mostrar los que existan; si hay 0, ocultar la sección.
2. **Blog**: archivos `.md` con frontmatter, renderizados con `react-markdown` + `remark-gfm` + `gray-matter`. CTA definidos en frontmatter (array) y renderizados como bloque final.
3. **Carpeta**: `content/blog/` en la raíz del repo.
4. **Navegación**: enlace "Blog" en header (desktop + móvil) y footer.
5. **Portada**: campo `cover` opcional en frontmatter; para este artículo se reutiliza la URL pública de la foto del collar de amatista (ya permitida por `images.remotePatterns`).

## Tareas

### Parte A — Productos relacionados

**A1. Consulta** — `src/lib/supabase/queries.ts`
Añadir:
```ts
export async function getProductosRelacionados(params: {
  slugActual: string;
  grupoActual?: string | null;
  coleccionId?: string | null;
  limite?: number; // 2
}): Promise<ProductoDB[]>
```
Lógica:
- Filtro base: `.eq("activo", true).gt("stock_disponible", 0).eq("modo_acceso", "disponible").neq("slug", slugActual)`.
- Si `grupoActual` existe, excluir variantes: `.neq("grupo", grupoActual)` (Nota: `neq` sobre `null` no excluye; filtrar también en memoria los que compartan `grupo`).
- Paso 1: misma colección (`.eq("coleccion_id", coleccionId)`), `.limit(limite)`.
- Paso 2: si faltan,查询 global (mismos filtros) y descartar los ya elegidos.
- Fallback total a `[]` con `console.error`, igual que el resto del archivo.

**A2. Componente** — `src/components/product/RelatedProducts.tsx` (nuevo)
- Componente sin estado (se renderiza dentro del árbol cliente, pero sin hooks).
- Props: `{ productos: ProductoDB[] }`.
- Si `productos.length === 0` → devolver `null`.
- Markup: `<section className="related-section">` con `<div className="container">`, `<h2 className="related-title">También puede interesarte</h2>` y `<div className="products-grid related-grid">`.
- Cada tarjeta reutiliza clases existentes: `article.product-card` → `Link.product-card-media` con `Image` (`alt` vía `altProducto` de `@/lib/seo`), `h3.product-card-title`, precio con `ProductPrice` + `precioFinal` de `@/utils/precio`, y `Link.product-card-btn` a `/producto/${slug}`.
- Solo 2 elementos como máximo (la consulta ya limita).

**A3. Página** — `src/app/producto/[slug]/page.tsx`
- Tras obtener `coleccionNombre`, llamar `getProductosRelacionados({ slugActual: producto.slug, grupoActual: producto.grupo, coleccionId: producto.coleccion_id, limite: 2 })`.
- Pasar `relacionados` como prop a `ProductoClient`.

**A4. Cliente** — `src/app/producto/[slug]/ProductoClient.tsx`
- Añadir `relacionados: ProductoDB[]` a `ProductoClientProps` y a la firma.
- Renderizar `<RelatedProducts productos={relacionados} />` justo después de `</main>` y antes de `<SiteFooter />`.

**A5. CSS** — `src/app/globals.css`
- `.related-section { padding: clamp(2rem, 6vw, 4rem) 0 clamp(4rem, 10vw, 6rem); }`
- `.related-title { font-family: serif; font-size: clamp(1.4rem, 3vw, 2rem); text-align: center; margin-bottom: clamp(1.5rem, 4vw, 2.5rem); }`
- `.related-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: 760px; margin: 0 auto; }`
- Media query `@media (max-width: 640px) { .related-grid { grid-template-columns: 1fr; } }`

### Parte B — Blog

**B1. Dependencias**
```
npm install react-markdown remark-gfm gray-matter
npm install -D @types/gray-matter
```

**B2. Capa de datos** — `src/lib/blog.ts` (nuevo)
- Tipos:
```ts
export interface BlogCta { etiqueta: string; href: string; descripcion?: string }
export interface BlogFrontmatter {
  title: string; description: string; date: string; updated?: string;
  author?: string; categoria?: string; cover?: string; coverAlt?: string;
  tags?: string[]; cta?: BlogCta[];
}
export interface BlogPost { slug: string; frontmatter: BlogFrontmatter; content: string }
```
- `const BLOG_DIR = path.join(process.cwd(), "content", "blog")`.
- `getAllPosts(): BlogPost[]` — lee `.md`, parsea con `gray-matter`, ordena por `date` desc; ignora archivos que fallen con `console.error`.
- `getPostBySlug(slug): BlogPost | null`.
- `getBlogSlugs(): string[]`.
- Validación mínima: `title` y `description` obligatorios; si faltan, se ignora el post.

**B3. Componentes**
- `src/components/blog/BlogCta.tsx`: renderiza un bloque CTA (`Link.cta-btn` + `descripcion` opcional) con clase `blog-cta`.
- `src/components/blog/BlogProse.tsx`: `<ReactMarkdown remarkPlugins={[remarkGfm]} components={{ h2, h3, a, img }}>`.
  - `h2`/`h3`: añaden `id` slugificado del texto (para anclas).
  - `a`: si es externo, `target="_blank" rel="noreferrer"`.
  - `img`: `alt` obligatorio (si falta, usa `coverAlt` o título del post).
- `src/components/blog/BlogCard.tsx`: tarjeta del índice (portada opcional + `categoria`, `title`, `date`, `description`, "Leer artículo →").

**B4. Índice** — `src/app/blog/page.tsx`
- Server component.
- `export const metadata = { title: "Blog", description: "..." , alternates: { canonical: "/blog" } }`.
- `getAllPosts()` → listado de `BlogCard`.
- `<SiteHeader />`, `<main className="blog-index">` con `<h1>Blog</h1>`, grid de cards, `<SiteFooter />`.
- Estado vacío: mensaje "Próximamente artículos del taller…".

**B5. Artículo** — `src/app/blog/[slug]/page.tsx`
- `export const revalidate = 3600;`
- `generateStaticParams()` → `getBlogSlugs()`.
- `generateMetadata({params})`:
  - `title: post.frontmatter.title` (el template del layout añade `| Romany Melan`).
  - `description: post.frontmatter.description`.
  - `alternates: { canonical: '/blog/' + slug }`.
  - `openGraph` con `type: "article"`, `publishedTime: date`, `images: cover ? [{url: cover, alt: coverAlt}] : undefined`.
- `notFound()` si no existe.
- Render: cabecera (`categoria`, `h1`, fecha, autor), portada opcional (`Image` con `fill`), `<BlogProse>`, y al final `frontmatter.cta?.map(cta => <BlogCta ... />)`.
- `<SiteHeader />` / `<SiteFooter />`.

**B6. Contenido** — `content/blog/significado-espiritual-propiedades-amatista-joyeria-autor.md` (nuevo)
Frontmatter:
```yaml
---
title: "El Significado Espiritual y las Propiedades de la Amatista en la Joyería de Autor"
description: "Descubre el significado espiritual de la amatista, sus propiedades y cómo la integramos en la Colección Soberbia de Romany Melan: joyería de autor en micro macramé y metales nobles."
date: "2026-11-15"
updated: "2026-11-15"
author: "Romany Melan"
categoria: "Mineralogía"
cover: "https://ztmlhbatqlizozmlcyqm.supabase.co/storage/v1/object/public/productos/1794506437152-5zo15bcqpab-zoom_collar_amatista_pura_1.jpg"
coverAlt: "Collar artesanal con amatista natural de la Colección Soberbia de Romany Melan"
tags: ["amatista", "joyería de autor", "micro macramé", "piedras naturales"]
cta:
  - etiqueta: "Ver la Colección Soberbia"
    href: "/coleccion/soberbia"
    descripcion: "Descubre collares, anillos y piezas tejidas a mano con amatista natural."
---
```
Cuerpo (Markdown, con H2/H3):
- Párrafos introductorios (universo de la joyería artesanal, amatista, Romany Melan, Colección Soberbia).
- `## ¿Qué es la Amatista y cuál es su simbolismo ancestral?` + párrafo etimológico (`amethystos`) + lista con `**Equilibrio y Calma:**`, `**Transformación y Autenticidad:**`, `**Exclusividad Natural:**`.
- `## La Fusión del Arte: Micro Macramé, Metales Nobles y Mineralogía` + `### Metales Nobles` y `### El Arte del Micro Macramé`.
- `## Lleva la Energía de la Colección Soberbia contigo` + párrafo de cierre y pregunta final.
- **Nota**: la línea "👉 Ver la Colección Soberbia…" del texto original **no** se incluye en el cuerpo; se sustituye por el bloque CTA del frontmatter.

**B7. Navegación**
- `src/components/SiteHeader.tsx`: añadir `{ href: "/blog", label: "Blog" }` a `ENLACES_DESKTOP` (desktop y móvil comparten el array).
- `src/components/SiteFooter.tsx`: añadir `<li><Link className="footer-link" href="/blog">Blog</Link></li>`.

**B8. Sitemap** — `src/app/sitemap.ts`
- Importar `getAllPosts`.
- Añadir `/blog` (priority 0.6, weekly).
- Añadir cada post: `/blog/${slug}` con `lastModified` de `date`/`updated`, priority 0.6, monthly.

**B9. CSS** — `src/app/globals.css`
- `.blog-index`, `.blog-grid` (grid auto-fill minmax 300px), `.blog-card`, `.blog-card-cover`, `.blog-card-body`, `.blog-card-meta`, `.blog-card-title`, `.blog-card-desc`, `.blog-card-link`.
- `.blog-post`, `.blog-post-header`, `.blog-post-title`, `.blog-post-meta`, `.blog-post-cover`.
- `.blog-prose` (tipografía: h2/h3, p, ul/li, strong, a, blockquote) con `max-width: 720px`.
- `.blog-cta` (bloque destacado con borde/acento).

## Verificación
- `npm install` completado; `npx tsc --noEmit`; `npm run lint`; `npm run build`.
- Con el server de producción:
  - `/producto/collar-amatista-pura` muestra **exactamente 2** tarjetas "También puede interesarte", ninguna es el producto actual ni su variante, todas con `stock_disponible>0` y `modo_acceso='disponible'`.
  - `/blog` lista el artículo con portada, título, fecha y descripción.
  - `/blog/significado-espiritual-propiedades-amatista-joyeria-autor` renderiza H2/H3 reales (`<h2>`, `<h3>`), listas, y el bloque CTA con enlace a `/coleccion/soberbia`.
  - `<title>` del post = "El Significado Espiritual… | Romany Melan"; meta description presente; `canonical` correcto.
  - `/sitemap.xml` incluye `/blog` y la URL del post.
  - Header y footer muestran "Blog" y navegan al índice.

## Riesgos / notas
- **Stock y modo de acceso**: si un producto activo tiene `stock_disponible=0` o `modo_acceso` distinto de `disponible`, no aparecerá (comportamiento esperado). Si no hay suficientes, la sección muestra menos de 2.
- **Variantes**: se excluyen las variantes del mismo `grupo` para no promocionar "la misma pieza".
- **Dependencias nuevas**: `react-markdown` (ESM) funciona en server components con Next 15; `gray-matter` es CJS y se usa solo en servidor.
- **Cover hardcodeado**: la portada apunta a una URL de Supabase; si cambia la imagen del producto, actualizar el frontmatter.
- **Rutas dinámicas**: `dynamicParams` se deja activo (por defecto) para que un `.md` nuevo funcione sin redeploy; el build seguirá pre-renderizando los existentes.
- No requiere migraciones de base de datos.