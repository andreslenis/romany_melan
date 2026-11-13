# Plan: Texto del badge de producto e iconos reales de redes sociales

## Objetivo

1. En la tarjeta de producto de Soberbia, la línea **Origen** debe mostrar `Oro Laminado 18K & Gema de Selección Especial` en lugar de `Oro Laminado 18K & Amatista Natural`. La línea **Singular** conserva `Oro Macizo 18K & Gema de Selección Especial`.
2. Los iconos monocromáticos actuales del footer (Instagram y WhatsApp) se reemplazan por los PNG reales de `resources/icons/` (`instagram.png`, `whatsapp.png`), con tamaño ajustado.
3. Los mismos iconos del modal **Contacto** se reemplazan por los mismos PNG.

## Hallazgos del código

- `src/app/coleccion/soberbia/SoberbiaClient.tsx:246-250` es el único uso de `.product-card-badge` (definido en `src/app/globals.css:870-873`). El texto sale de un ternario por `producto.linea`:
  - `origen` → `"Oro Laminado 18K & Amatista Natural"`
  - `singular` → `"Oro Macizo 18K & Gema de Selección Especial"`
- `src/components/SiteFooter.tsx:40-66` renderiza los dos enlaces sociales con SVG inline (`width/height="24"`, `fill="currentColor"`).
- `src/components/SiteFooter.tsx:137-143` repite los mismos iconos en SVG dentro del modal **Contacto** (`width/height="20"`, `stroke="currentColor"`).
- `src/app/globals.css:637-674` define `.social-link` (círculo de `2.75rem`, borde 1px) y `.social-link--instagram` / `.social-link--whatsapp` (color `#E1306C` / `#25D366` + hover teñido). Ese color solo afecta a los SVG.
- Next.js sirve `public/` en la raíz: las imágenes deben copiarse a `public/resources/icons/` y referenciarse como `/resources/icons/<archivo>.png` (mismo patrón que `/resources/isotipo.png` en `src/app/page.tsx:74`). `next.config.ts` no necesita cambios.
- `src/app/coleccion/[slug]/CollectionClient.tsx` no usa `.product-card-badge`; no requiere cambios.

## Decisiones confirmadas

- Texto del badge: cambiar **solo la rama `origen`**; la rama `singular` queda intacta.
- Alcance de los iconos: **footer y modal Contacto**.
- Estilo: **quitar color y borde del wrapper** `.social-link--instagram` / `.social-link--whatsapp` para que no compitan con el logo a color.

## Tareas

1. **Copiar los PNG a `public/`** (el repo ya duplica `resources/` dentro de `public/`):
   - `resources/icons/instagram.png` → `public/resources/icons/instagram.png`
   - `resources/icons/whatsapp.png` → `public/resources/icons/whatsapp.png`
   - No modificar los originales de `resources/icons/`.

2. **Editar `src/app/coleccion/soberbia/SoberbiaClient.tsx`** (líneas 246-250): dejar solo dos ramas de texto.
   - `producto.linea === "origen" ? "Oro Laminado 18K & Gema de Selección Especial" : "Oro Macizo 18K & Gema de Selección Especial"`.

3. **Editar `src/components/SiteFooter.tsx` — iconos del footer** (bloque `.socials`, líneas 40-66):
   - Sustituir cada `<svg>…</svg>` por `<Image src="/resources/icons/instagram.png" alt="" width={24} height={24} className="social-icon" />` y el equivalente de WhatsApp.
   - Añadir `import Image from "next/image";`.
   - Mantener `aria-label="Instagram"` / `aria-label="WhatsApp"`, el `href` y `target`/`rel` de cada enlace. El `alt=""` evita duplicar el nombre accesible porque el enlace ya tiene `aria-label`.

4. **Editar `src/components/SiteFooter.tsx` — modal Contacto** (líneas 137-143):
   - Reemplazar los dos SVG de 20×20 por `<Image … width={20} height={20} className="contact-icon" />` apuntando a los mismos PNG.
   - No tocar el icono de correo (línea 124).

5. **Ajustar el CSS en `src/app/globals.css`:**
   - En `.social-link--instagram` y `.social-link--whatsapp` (y sus `:hover`): eliminar `color`, `border-color`, `background-color` y `box-shadow` de hover, dejando solo el comportamiento de tamaño/transición. Con ello el enlace deja de tener círculo teñido y borde.
   - En `.social-link:hover` conservar únicamente `transform: translateY(-2px)`; retirar el `box-shadow` para no arrastrar una sombra genérica.
   - Añadir:
     ```css
     .social-link img {
       width: 1.5rem;
       height: 1.5rem;
       object-fit: contain;
     }
     ```
     (1.5rem = 24px dentro del círculo de 2.75rem, igual que el SVG anterior).
   - Añadir regla equivalente para el icono de 20px del modal, con `flex-shrink: 0`:
     ```css
     .contact-icon {
       width: 1.25rem;
       height: 1.25rem;
       object-fit: contain;
       flex-shrink: 0;
     }
     ```

## Riesgos y consideraciones

- **Fondo de los PNG (no verificado).** No puedo inspeccionar visualmente las imágenes con este modelo. Si los PNG traen fondo blanco (no transparente), al quitar el borde se verá un cuadrado blanco sobre el fondo claro del footer. Mitigación: si al validar aparece ese cuadrado, añadir `mix-blend-mode: multiply;` a `.social-link img` y `.contact-icon` (inofensivo si el fondo ya es transparente). No aplicarlo de entrada para no alterar logos con fondo transparente.
- **Contraste del enlace.** Sin `color` ni borde, los enlaces solo se distinguen por el propio logo; los PNG a color resuelven el contraste. El `aria-label` se mantiene para lectores de pantalla.
- **Consistencia de assets.** Si el build se ejecuta desde un checkout donde `public/resources/icons/` no exista, las imágenes fallarán; por eso el paso 1 es obligatorio y previo al render.
- **`next/image` sin optimizar.** El resto del sitio usa `unoptimized` en imágenes locales grandes; para estos PNG pequeños se usa el optimizador por defecto (no requiere cambios en `next.config.ts`).

## Validación

1. `npx tsc --noEmit` (o el script de typecheck del proyecto) para confirmar que el JSX y los tipos de `next/image` están correctos.
2. Levantar el entorno y revisar:
   - `GET /coleccion/soberbia`: en la línea **Origen** el badge dice `Oro Laminado 18K & Gema de Selección Especial`; al cambiar a **Singular** sigue diciendo `Oro Macizo 18K & Gema de Selección Especial`.
   - Footer: los dos iconos cargan desde `/resources/icons/*.png` (sin errores 404 en la pestaña Network), se ven nítidos a 24px, sin borde ni círculo de color, y el hover solo desplaza 2px.
   - Modal **Contacto**: los iconos de Instagram y WhatsApp miden 20px, están alineados con el texto y no se deforman; el icono de correo permanece igual.
   - Accesibilidad: cada enlace social conserva su `aria-label` y abre en pestaña nueva con `rel="noreferrer"`.

## Fuera de alcance

- Cambiar el texto de la línea **Singular**.
- Rediseñar el modal **Contacto** o el resto del footer.
- Crear versiones SVG/.webp de los iconos.