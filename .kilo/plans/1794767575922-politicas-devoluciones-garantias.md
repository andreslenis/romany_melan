# Plan: Política de Devoluciones y Garantías (página + footer + nota en ficha)

## Contexto

Romany Melan necesita publicar el texto oficial de **Política de Devoluciones y Garantías** y hacerlo visible (a) en el footer y (b) en la ficha de producto antes de comprar.

Situación actual:
- `src/components/SiteFooter.tsx` ya tiene un modal **"Políticas"** con 3 secciones: *Políticas de envío* (dice "2 a 5 días hábiles"), *Cambios y Garantías* (acepta cambios por "inconformidad en el modelo" a 5 días) y *Tratamiento de Datos*.
- Esa sección **contradice** el texto oficial nuevo (no hay devoluciones por cambio de opinión; solo garantía por defecto de fabricación, 30 días).
- La ficha de producto (`src/app/producto/[slug]/ProductoClient.tsx`) tiene el botón de compra dentro de `<div className="pdp-actions">` (líneas ~567-616) y no muestra tiempos de fabricación.

## Decisiones tomadas (confirmadas con el usuario)

1. **Página independiente indexable** en `/politicas/devoluciones-y-garantias` (server component, con metadata). El footer la enlaza con un `Link` real.
2. **Actualizar el modal "Políticas"** del footer: reemplazar la sección *Cambios y Garantías* por un resumen alineado + enlace "Ver política completa" a la nueva página (evita contradicción y duplicación).
3. **Tiempo oficial: 3 a 5 días** en todo el sitio → corregir el modal de envíos ("2 a 5 días hábiles" → "3 a 5 días hábiles").
4. **Nota en la ficha: texto informativo fijo** (no acordeón), con `className="pdp-access-note"`, siempre visible bajo el botón de compra.
5. **La nueva página incluye un bloque "Envíos"** al inicio (fabricación 3-5 días + entrega 2-5 días) para que el enlace "Políticas de Envío y Garantía" sea exacto.

Fuera de alcance: añadir la página al `sitemap.xml`, crear modal nuevo, tocar checkout/admin.

## Contenido oficial (verbatim, fuente única)

Se centraliza en un módulo para que página y modal no diverjan.

**Envíos** (bloque breve):
- Tiempo de taller: 3 a 5 días hábiles de fabricación antes del despacho.
- Entrega: 2 a 5 días hábiles según ciudad, una vez despachado.
- Costo de envío incluido en el precio del producto.

**Política de Devoluciones y Garantías** (4 secciones):
1. **Compromiso Artesanal y Calidad**: En Romany Melan, cada pieza de alta joyería es elaborada a mano bajo pedido, utilizando hilos de alta tenacidad, metales nobles y gemas naturales. Debido a la naturaleza artesanal de nuestros procesos, cada creación es única.
2. **Cambios y Garantías**: Ofrecemos garantía por defectos de fabricación o en los materiales (hilos, estructura de micro-macramé, componentes metálicos o gemas) dentro de los 30 días siguientes a la recepción de tu pedido. Si tu pieza presenta alguna inconsistencia al llegar, contáctanos de inmediato para gestionarla.
3. **Condiciones para Devolución o Cambio**: La pieza debe encontrarse en perfecto estado, sin signos de uso indebido y conservando su empaque original. Debido a la exclusividad de nuestras colecciones y a que muchas piezas se elaboran de manera personalizada, no realizamos devoluciones de dinero por cambios de opinión o preferencia personal, únicamente por garantía o desperfecto de fabricación debidamente verificado.
4. **Procedimiento**: Para iniciar una solicitud de garantía o revisión, comunícate con nosotros a través de nuestros canales oficiales de atención (WhatsApp, Mensaje Instagram o Correo Electrónico). Te indicaremos los pasos para el envío de la pieza a nuestro taller.

## Tareas

### 1. Módulo de contenido — `src/lib/politicas.ts` (nuevo)
- `export const POLITICA_ENVIOS` → `{ titulo, parrafos: string[] }` con los 3 puntos de envíos.
- `export const POLITICA_DEVOLUCIONES` → `{ titulo, secciones: { titulo, texto }[] }` con las 4 secciones oficiales.
- `export const NOTA_PRODUCTO` → `"✨ Pieza hecha a mano bajo pedido (3 a 5 días de fabricación). Conoce nuestras Políticas de Envío y Garantía."`
- `export const PAGINA_POLITICA = { href: "/politicas/devoluciones-y-garantias", titulo: "Política de Devoluciones y Garantías", enlaceFooter: "Garantías y Cambios" }`
- Tipos exportados para reutilizar en el render.

### 2. Página — `src/app/politicas/devoluciones-y-garantias/page.tsx` (nuevo)
- Server component (sin `"use client"`).
- `export const metadata: Metadata = { title: "Política de Devoluciones y Garantías", description: "..." , alternates: { canonical: "/politicas/devoluciones-y-garantias" } }` (el template del layout añade `| Romany Melan`).
- Estructura: `<SiteHeader />`, `<main className="policy-page">` con `<h1>` (título), bloque *Envíos* (sección 1) y las 4 secciones oficiales renderizadas desde el módulo, `<SiteFooter />`.
- Enlaces de contacto: reutilizar los datos ya presentes en el footer (WhatsApp `https://wa.me/573122608873`, correo `romanymelanstudio@gmail.com`, Instagram `@romanymelan`).

### 3. Estilos — `src/app/globals.css`
Añadir (mínimo, coherente con el resto):
- `.policy-page { padding: clamp(3rem, 8vw, 6rem) 0; }`
- `.policy-title { font-family: serif; font-size: clamp(1.75rem, 4vw, 2.75rem); text-align: center; margin-bottom: 2.5rem; }`
- `.policy-section { max-width: 760px; margin: 0 auto 2rem; }`
- `.policy-section-title { font-weight: 600; font-size: 1.05rem; margin-bottom: 0.5rem; }`
- `.policy-text { line-height: 1.75; color: rgba(17,17,17,0.75); }`
- `.pdp-policy-note { margin-top: 1rem; }` (para separar la nota del botón).

### 4. Footer — `src/components/SiteFooter.tsx`
- Importar `Link` de `next/link` y las constantes de `@/lib/politicas`.
- Añadir `<li>` en `footer-links` con `<Link className="footer-link" href={PAGINA_POLITICA.href}>Garantías y Cambios</Link>`.
- En el modal *Políticas de envío*: cambiar "2 a 5 días hábiles" → **"3 a 5 días hábiles"** (alineado con la nota del producto).
- En el modal *Cambios y Garantías*: sustituir los 3 párrafos actuales por un resumen breve alineado al texto oficial (garantía 30 días por defecto de fabricación; sin devoluciones por cambio de opinión; pieza en perfecto estado con empaque original) + `<Link href={PAGINA_POLITICA.href}>Ver política completa</Link>`.
- Mantener *Tratamiento de Datos* sin cambios.

### 5. Nota en la ficha — `src/app/producto/[slug]/ProductoClient.tsx`
- Justo después del `</div>` que cierra `pdp-actions` (línea ~616) y antes de `pdp-share`, insertar:
  ```tsx
  <p className="pdp-access-note pdp-policy-note">
    {"✨ Pieza hecha a mano bajo pedido (3 a 5 días de fabricación). Conoce nuestras "}
    <Link href={PAGINA_POLITICA.href}>Políticas de Envío y Garantía</Link>
    {". "}
  </p>
  ```
  (o renderizar `NOTA_PRODUCTO` dividiendo el enlace; usar la constante para el texto plano).
- Importar `Link` (ya importado en el archivo) y `PAGINA_POLITICA` desde `@/lib/politicas`.
- Se muestra en **todos** los estados de `modoAcceso` (disponible / circulo / lista de espera), ya que es información de transparencia previa a la compra.

### 6. Verificación
- `npx tsc --noEmit` y `npm run lint`.
- `npm run build` → `/politicas/devoluciones-y-garantias` debe aparecer como ruta estática (○).
- Comprobar con el server de producción:
  - `/politicas/devoluciones-y-garantias` devuelve 200 y el `<title>` esperado; el texto de las 4 secciones está en el HTML inicial (SSR, sin JS).
  - `/producto/<slug>` contiene la nota con el enlace bajo el botón de compra.
  - El footer muestra "Garantías y Cambios" y navega a la página.
  - El modal "Políticas" ya no dice "2 a 5 días" ni mantiene el texto contradictorio.

## Riesgos / notas
- **Contradicción de contenido**: si no se actualiza el modal (tarea 4), el sitio mostraría dos versiones incompatibles de la garantía.
- **Footer compartido**: `SiteFooter` se renderiza en todas las páginas; el nuevo enlace aparece globalmente (comportamiento deseado).
- **SEO**: la página es indexable; se decide **no** incluirla en `sitemap.xml` (fuera de alcance). Si se quiere indexar vía sitemap, añadir entrada con prioridad ~0.3.
- **Texto "3 a 5 días"**: unifica fabricación en todo el sitio; el detalle de entrega (2-5 días) permanece en el modal y en la nueva página.
- No se requieren migraciones de base de datos ni cambios en Supabase.