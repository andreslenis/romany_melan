# Plan de Implementación - Romany Melan

## Resumen de Cambios Solicitados

1. **Separar sesiones Admin/Cliente** - Admin no debe tener sesión como cliente
2. **Email de bienvenida** - Al crear usuario, enviar email con texto específico
3. **Próximos Lanzamientos dinámico** - Mostrar productos de BD (línea singular, modo "proximamente")
4. **Eliminar profile-teaser-intro** - Quitar texto hardcodeado en perfil
5. **Línea Singular solo para usuarios logueados** - Filtrar productos con marca "proximamente" en BD
6. **Productos por colección** - Cada producto solo en su colección asignada (fix avaricia en soberbia)
7. **Botón compartir producto** - WhatsApp, Instagram, copiar enlace (www.romanymelan.com/producto/slug)
8. **Footer Instagram** - Link a https://www.instagram.com/romanymelan?cplk=eGwzaGluNWg4amRs&utm_source=qr
9. **Footer Pinterest → WhatsApp** - Link a https://wa.me/message/MPA2IBBSX32DM1
10. **Footer Contacto → Modal** - Modal tipo "Confianza y Garantía" con info de contacto
11. **Footer Políticas → Modal** - Modal con 3 acordeones: Envío, Cambios/Garantías, Tratamiento Datos

---

## Análisis Técnico por Requerimiento

### 1. Separar Sesiones Admin/Cliente

**Estado actual:** `AdminGuard` usa `supabase.auth.getSession()` igual que clientes. Ambos usan la misma tabla `auth.users`.

**Solución:** 
- Mantener autenticación Supabase separada por rol
- Admin usa email/password en `/admin/login` (ya implementado)
- Cliente usa email/password/OAuth en `/crear-perfil` y `/inicio-sesion`
- **No compartir sesión**: AdminGuard debe verificar rol `admin` en tabla `admins`, no solo sesión activa
- Redirigir admin logueado a `/admin/dashboard`, cliente a `/mi-perfil`

**Archivos a modificar:**
- `src/components/admin/AdminGuard.tsx` - Verificar tabla `admins` via API route
- `src/app/admin/login/page.tsx` - Ya OK, usa signInWithPassword
- Crear `src/app/api/admin/auth/route.ts` - Verificar admin server-side

---

### 2. Email de Bienvenida al Crear Usuario

**Estado actual:** `ProfileContext.registrar()` usa `supabase.auth.signUp()` pero no envía email personalizado.

**Opciones:**
- **A. Supabase Auth Email Templates** (Recomendado): Configurar template en Dashboard > Authentication > Email Templates > "Confirm signup"
- **B. Resend/SendGrid via Edge Function**: Más control, requiere servicio externo
- **C. Supabase Database Trigger + Edge Function**: Trigger en `auth.users` insert

**Recomendación: Opción A** - Más simple, nativo, gratuito. Configurar template HTML con el texto proporcionado.

**Variables disponibles en template:** `{{ .Email }}`, `{{ .ConfirmationURL }}`, `{{ .User.Metadata.full_name }}`

**Texto del email** (proporcionado):
```
Asunto: Bienvenida al Círculo Romany Melan ✨ Tu historia comienza aquí.

Hola, [Nombre del Cliente]:

Es un honor darte la bienvenida a El Círculo Romany Melan.

Más que una cuenta en nuestra plataforma, has abierto la puerta a un espacio donde el tiempo se detiene y la alta joyería artesanal cobra vida. Cada pieza que creamos —ya sea en nuestra Línea Origen o Singular— nace de horas de dedicación, entrelazando hilos de alta tenacidad, oro laminado y gemas naturales en un ritual de precisión milimétrica.

Como miembro de nuestro círculo, ahora tienes acceso exclusivo a:

Lanzamientos anticipados de nuestras colecciones inspiradas en los detalles más sutiles y memorables.

Piezas de edición limitada, diseñadas para quienes eligen llevar una certeza silenciosa sobre la piel.

Atención y asesoría personalizada directamente a través de nuestros canales oficiales.

Te invitamos a explorar la colección inaugural y descubrir la pieza que resonará con tu momento actual en www.romanymelan.com.

Gracias por permitirnos tejer esta historia contigo.

Con distinción,

El equipo de Romany Melan

Tejer esta historia en tu piel.
```

**Acción:** Documentar configuración en Supabase Dashboard (no código). Verificar que `emailRedirectTo` apunte a `/mi-perfil`.

---

### 3. Próximos Lanzamientos Dinámicos (Perfil)

**Estado actual:** `src/app/mi-perfil/page.tsx` líneas 204-239 usa `productosSingular` hardcodeado de `src/data/productos.ts`.

**Solución:** 
- Consultar BD `productos` donde `linea = 'singular'` Y `modo_acceso = 'espera'` (o similar)
- Mostrar solo productos marcados como "próximamente" en BD
- Reemplazar import estático por fetch dinámico

**Archivos a modificar:**
- `src/app/mi-perfil/page.tsx` - Agregar fetch de productos singulares "proximamente"
- Tipo `ModoAcceso` en `src/lib/types.ts` ya tiene `"espera"`

---

### 4. Eliminar profile-teaser-intro

**Estado actual:** `src/app/mi-perfil/page.tsx` líneas 206-210:
```tsx
<p className="profile-teaser-intro">
  La Línea Singular en Oro Macizo 18K se abre por primera vez para los
  miembros del Círculo. Cada pieza se numera y se entrega con
  certificado de origen.
</p>
```

**Acción:** Eliminar este bloque `<p className="profile-teaser-intro">...</p>`

---

### 5. Línea Singular Solo para Usuarios Logueados (Perfil)

**Estado actual:** Ya implementado en:
- `src/app/producto/[slug]/page.tsx` líneas 207-222: Bloquea si `esSingular && !perfil`
- `src/app/coleccion/soberbia/SoberbiaClient.tsx` líneas 83-119: `singularLocked` state

**Perfil:** El cambio #3 ya filtra por `modo_acceso = 'espera'` en BD, lo que implícitamente requiere login para ver detalles (página de producto valida sesión).

**Verificación:** Confirmar que productos con `modo_acceso = 'circulo'` o `'espera'` solo se muestran en perfil si usuario logueado.

---

### 6. Productos Solo en Su Colección Asignada

**Problema:** Producto con `categoria: 'avaricia'` aparece en colección `soberbia`.

**Estado actual:** 
- `src/app/coleccion/[slug]/CollectionClient.tsx` filtra por `coleccion_id` (línea 59-65)
- `src/app/coleccion/soberbia/SoberbiaClient.tsx` NO filtra por colección, trae TODOS los productos activos (línea 58-62)

**Solución:**
- Modificar `SoberbiaClient.tsx` para filtrar por `coleccion_id` de la colección "soberbia"
- O migrar Soberbia a usar `CollectionClient` genérico
- Asegurar que productos en BD tengan `coleccion_id` correcto

**Archivos a modificar:**
- `src/app/coleccion/soberbia/SoberbiaClient.tsx` - Agregar filtro por `coleccion_id`
- Verificar datos en BD: `productos.coleccion_id` debe coincidir con `colecciones.id` donde `slug='soberbia'`

---

### 7. Botón Compartir Producto

**Ubicación:** `src/app/producto/[slug]/page.tsx` en sección `pdp-actions` o `pdp-header`

**Funcionalidad:**
- URL: `www.romanymelan.com/producto/{slug}` (usar `window.location.origin`)
- Opciones: WhatsApp, Instagram (copiar enlace), Copiar al portapapeles
- UI: Botón con dropdown o 3 botones pequeños

**Implementación:**
```tsx
const shareUrl = `${window.location.origin}/producto/${slugActivo}`;
- WhatsApp: `https://wa.me/?text=${encodeURIComponent(shareUrl)}`
- Instagram: No tiene API directa de share, usar "Copiar enlace"
- Copiar: `navigator.clipboard.writeText(shareUrl)`
```

**Archivos a modificar:**
- `src/app/producto/[slug]/page.tsx` - Agregar estado/share handlers + UI

---

### 8. Footer Instagram Link

**Estado actual:** `src/components/SiteFooter.tsx` línea 39: `href="#"`

**Cambio:** `href="https://www.instagram.com/romanymelan?cplk=eGwzaGluNWg4amRs&utm_source=qr"`

---

### 9. Footer Pinterest → WhatsApp

**Estado actual:** `src/components/SiteFooter.tsx` líneas 46-51: Botón Pinterest con SVG

**Cambio:** 
- Reemplazar SVG Pinterest por SVG WhatsApp
- `href="https://wa.me/message/MPA2IBBSX32DM1"`
- `aria-label="WhatsApp"`

---

### 10. Footer Contacto → Modal

**Estado actual:** `src/components/SiteFooter.tsx` línea 28: `<Link href="/#contacto">Contacto</Link>`

**Cambio:** 
- Convertir a `<button>` que abre modal
- Reutilizar estructura modal de "Confianza y Garantía" (líneas 61-99)
- Contenido:
  - Correo: romanymelanstudio@gmail.com
  - WhatsApp: +57 312 260 8873
  - Instagram: @romanymelan

**Archivos a modificar:**
- `src/components/SiteFooter.tsx` - Agregar state `contactOpen`, modal, reemplazar Link por button

---

### 11. Footer Políticas → Modal con Acordeones

**Estado actual:** `src/components/SiteFooter.tsx` línea 18: `<Link href="/#policies">Políticas</Link>`

**Cambio:**
- Convertir a `<button>` que abre modal
- Modal con 3 `<details>` (acordeones nativos):
  1. **Políticas de envío** - Texto proporcionado
  2. **Cambios y Garantías** - Texto proporcionado  
  3. **Tratamiento de Datos** - Texto proporcionado

**Archivos a modificar:**
- `src/components/SiteFooter.tsx` - Agregar state `policiesOpen`, modal con 3 details

---

## Plan de Ejecución Ordenado

### Fase 1: Base de Datos y Configuración (Sin código)
- [ ] Configurar email template "Confirm signup" en Supabase Dashboard
- [ ] Verificar/crear colección "soberbia" en BD con slug correcto
- [ ] Asignar `coleccion_id` correcto a productos en BD
- [ ] Marcar productos Singular con `modo_acceso = 'espera'` para "Próximos Lanzamientos"

### Fase 2: Footer (Independiente, rápido)
- [ ] **Tarea 8**: Cambiar link Instagram
- [ ] **Tarea 9**: Cambiar Pinterest → WhatsApp
- [ ] **Tarea 10**: Modal Contacto
- [ ] **Tarea 11**: Modal Políticas con 3 acordeones

### Fase 3: Autenticación Admin/Cliente
- [ ] **Tarea 1**: Crear `src/app/api/admin/auth/route.ts` para verificar admin
- [ ] **Tarea 1**: Modificar `AdminGuard.tsx` para usar API route
- [ ] Verificar que admin login redirige a `/admin/dashboard`

### Fase 4: Perfil y Productos
- [ ] **Tarea 3**: Fetch dinámico "Próximos Lanzamientos" en `mi-perfil/page.tsx`
- [ ] **Tarea 4**: Eliminar `profile-teaser-intro`
- [ ] **Tarea 6**: Filtrar productos por `coleccion_id` en `SoberbiaClient.tsx`

### Fase 5: Página de Producto
- [ ] **Tarea 7**: Botón compartir (WhatsApp, Copiar, Instagram)

### Fase 6: Validación
- [ ] Ejecutar `npm run lint` y `npm run build`
- [ ] Probar flujos: crear perfil → email bienvenida, login admin/cliente separados, compartir producto, modales footer

---

## Archivos a Modificar (Resumen)

| Archivo | Tareas |
|---------|--------|
| `src/components/SiteFooter.tsx` | 8, 9, 10, 11 |
| `src/components/admin/AdminGuard.tsx` | 1 |
| `src/app/admin/login/page.tsx` | 1 (verificar) |
| `src/app/api/admin/auth/route.ts` | 1 (nuevo) |
| `src/app/mi-perfil/page.tsx` | 3, 4 |
| `src/app/coleccion/soberbia/SoberbiaClient.tsx` | 6 |
| `src/app/producto/[slug]/page.tsx` | 7 |
| `src/lib/types.ts` | 3 (verificar tipos) |

---

## Riesgos y Consideraciones

1. **Email de bienvenida**: Depende de configuración en Supabase Dashboard, no código. Documentar pasos.
2. **Sesiones separadas**: AdminGuard actual permite cualquier usuario autenticado. Debe verificar tabla `admins`.
3. **Colecciones**: `SoberbiaClient` es hardcodeado; migrar a `CollectionClient` genérico sería mejor a largo plazo.
4. **Share en Instagram**: No hay Web Share API nativa para Instagram; usar "Copiar enlace" como fallback.
5. **Modales en Footer**: Reutilizar estilos existentes de "Confianza y Garantía" para consistencia.

---

## Validación Final

- [ ] `npm run lint` sin errores
- [ ] `npm run build` exitoso
- [ ] Flujo crear perfil → recibe email bienvenida
- [ ] Admin login → `/admin/dashboard` (no `/mi-perfil`)
- [ ] Cliente login → `/mi-perfil` (no `/admin`)
- [ ] Perfil muestra solo productos Singular con `modo_acceso='espera'`
- [ ] Colección Soberbia NO muestra productos de Avaricia
- [ ] Botón compartir copia URL correcta
- [ ] Footer links y modales funcionan