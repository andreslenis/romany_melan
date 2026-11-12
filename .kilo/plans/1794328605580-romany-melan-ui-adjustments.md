# Plan: Ajustes Adicionales - Romany Melan

## Resumen de Cambios Solicitados

1. **Eliminar menú hamburguesa** - No encaja con el estilo de la página
2. **Footer icons** - Instagram y WhatsApp con colores correspondientes y mayor tamaño
3. **Checkout flow** - Si usuario logueado, ocultar "Comprar como invitado" y "Crear perfil"
4. **Colombia departamentos/ciudades** - Verificar que estén completos en selectores de dirección
5. **Historial de pedidos en perfil** - Mostrar referencia y estado para compras con sesión iniciada
6. **Perfil "Mis Historias"** - Mostrar productos adquiridos después de comprar
7. **Admin panel** - Quitar opción "próximos lanzamientos" (modo_acceso: espera) al guardar/editar productos

---

## Análisis por Requerimiento

### 1. Eliminar Menú Hamburguesa

**Estado actual**: SiteHeader tiene hamburger button + mobile drawer (mobile-menu-drawer)
**Cambio**: 
- Remover completamente: `mobileMenuOpen` state, hamburger button, mobile-menu-overlay, mobile-menu-drawer
- En mobile: mostrar solo logo + nav links (Inicio, La Autora) + cart + auth icons en una sola fila
- Simplificar CSS: remover `.mobile-menu-overlay`, `.mobile-menu-drawer`, `.mobile-menu-*` styles

**Archivos**: `src/components/SiteHeader.tsx`, `src/app/globals.css`

---

### 2. Footer Icons - Instagram & WhatsApp

**Estado actual**: SVGs en `.social-link` con `stroke="currentColor"`, size 18x18
**Cambio**:
- **Instagram**: Color degradado oficial (#E1306C → #C13584 → #F56040 → #F77737) o al menos rosa/violáceo (#E1306C)
- **WhatsApp**: Verde oficial #25D366
- Tamaño: 24x24 o 28x28 (actualmente 18x18)
- `fill="currentColor"` en lugar de `stroke` para que tome el color

**Archivos**: `src/components/SiteFooter.tsx`, `src/app/globals.css` (`.social-link`, `.social-link svg`)

---

### 3. Checkout Flow - Usuario Logueado

**Estado actual**: `CheckoutForm` muestra 2 opciones: "Comprar como invitado" (invitado) y "Crear mi Perfil" (miembro)
**Cambio**:
- En `CheckoutPage`: detectar `perfil` de `usePerfil()`
- Si `perfil` existe: forzar `modo = "miembro"`, ocultar sección "Identificación" completa, pre-llenar datos del perfil (nombre, email, teléfono)
- Si no hay `perfil`: mantener comportamiento actual

**Archivos**: `src/app/checkout/page.tsx`, `src/components/checkout/CheckoutForm.tsx`

---

### 4. Colombia Departamentos/Ciudades

**Estado actual**: `src/lib/colombia.ts` tiene 32 departamentos con ciudades principales
**Verificación**: 
- Revisar si faltan departamentos (ej: Amazonas, Arauca, Casanare, Putumayo, San Andrés, Vaupés, Vichada ya están)
- La lista parece completa con 32 departamentos
- CheckoutForm ya usa `DEPARTAMENTOS` y `ciudadesPorDepartamento`

**Acción**: Verificar completitud, posiblemente agregar municipios faltantes si es necesario

**Archivos**: `src/lib/colombia.ts` (verificar), `src/components/checkout/CheckoutForm.tsx` (ya usa)

---

### 5. Historial de Pedidos en Perfil

**Estado actual**: `PerfilPage` ya muestra:
- `EnvioTracker` con `pedido.referencia` y estado de envío
- `HistoriaItem` en "Mis Historias" con productos, certificado, etc.
- Los pedidos se guardan en localStorage (`pedidos_v1`) via `ProfileContext.crearPedido()`

**Verificación necesaria**:
- Confirmar que al hacer checkout con sesión iniciada, el pedido se asocia al perfil
- `crearPedido` usa `esMiembro: datos.esMiembro` - verificar que se pase `true` cuando hay perfil
- Los pedidos ya se muestran en `pedidos` array del contexto

**Archivos**: `src/app/mi-perfil/page.tsx` (ya implementado), `src/context/ProfileContext.tsx` (verificar `crearPedido`)

---

### 6. Perfil "Mis Historias" - Productos Adquiridos

**Estado actual**: Sección "Mis Historias" en `PerfilPage` ya renderiza `HistoriaItem` por cada `pedido` en `pedidos`
- Muestra: fecha, referencia, método de pago, total, items (nombre, línea, talla, color hilo, precio), certificado digital
- **Verificar**: Que al completar compra con sesión iniciada, el pedido aparezca aquí automáticamente

**Archivos**: `src/app/mi-perfil/page.tsx` (ya implementado), `src/context/ProfileContext.tsx`

---

### 7. Admin Panel - Quitar "Próximos Lanzamientos"

**Estado actual**: Admin form en `AdminProductos` no tiene campo `modo_acceso` visible
- En BD/productos: campo `modo_acceso` puede ser "disponible", "circulo", "espera"
- "espera" = Próximos Lanzamientos (Línea Singular con lista de espera)
- El form actual guarda `linea` (origen/singular) y `activo` pero no `modo_acceso`

**Cambio**: 
- Agregar campo `modo_acceso` al formulario admin con opciones: "Disponible", "Círculo" (solo miembros), **eliminar "Espera/Próximos Lanzamientos"**
- O confirmar que no se usa y documentar

**Archivos**: `src/app/admin/productos/page.tsx` (agregar select `modo_acceso` sin opción "espera")

---

## Plan de Ejecución

### Fase 1: Header & Footer (Visual)
- [ ] 1.1 Eliminar hamburger menu de SiteHeader (state, button, drawer, overlay)
- [ ] 1.2 Simplificar SiteHeader mobile: nav links + cart + auth en una fila
- [ ] 1.3 Limpiar CSS: remover estilos `.mobile-menu-*`, `.nav-hamburger`, etc.
- [ ] 1.4 Actualizar Footer icons: Instagram (rosa/degradado), WhatsApp (verde), tamaño 24-28px

### Fase 2: Checkout Flow
- [ ] 2.1 En CheckoutPage: detectar `perfil` y forzar `modo="miembro"` si existe
- [ ] 2.2 Ocultar sección "Identificación" en CheckoutForm cuando hay perfil
- [ ] 2.3 Pre-llenar datos del perfil (nombre, email, teléfono) en CheckoutForm

### Fase 3: Colombia Data & Perfil
- [ ] 3.1 Verificar completitud de `DEPARTAMENTOS` en `colombia.ts` (32 deptos)
- [ ] 3.2 Verificar que pedidos con sesión iniciada aparecen en "Mis Historias" y "Estado de envío"
- [ ] 3.3 Confirmar `crearPedido` recibe `esMiembro=true` cuando hay perfil

### Fase 4: Admin Panel
- [ ] 4.1 Agregar campo `modo_acceso` select en AdminProductos form
- [ ] 4.2 Opciones: "Disponible", "Círculo" (sin "Espera/Próximos Lanzamientos")
- [ ] 4.3 Incluir `modo_acceso` en payload de guardar/editar

### Fase 5: Validación
- [ ] `npm run lint` sin errores nuevos
- [ ] `npm run build` exitoso
- [ ] Probar: header sin hamburger, footer icons con colores
- [ ] Probar: checkout logueado vs invitado
- [ ] Probar: perfil muestra pedidos tras compra
- [ ] Probar: admin guarda producto con modo_acceso correcto

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/SiteHeader.tsx` | Eliminar hamburger menu, simplificar mobile nav |
| `src/app/globals.css` | Remover CSS mobile menu, agregar estilos footer icons |
| `src/components/SiteFooter.tsx` | Actualizar SVGs Instagram/WhatsApp con colores y tamaño |
| `src/app/checkout/page.tsx` | Detectar perfil, forzar modo miembro, pre-llenar datos |
| `src/components/checkout/CheckoutForm.tsx` | Ocultar sección identificación si hay perfil, recibir datos pre-llenados |
| `src/lib/colombia.ts` | Verificar/agregar departamentos/ciudades faltantes |
| `src/app/mi-perfil/page.tsx` | Verificar funcionamiento (ya implementado) |
| `src/context/ProfileContext.tsx` | Verificar `crearPedido` con `esMiembro` |
| `src/app/admin/productos/page.tsx` | Agregar campo `modo_acceso` sin opción "espera" |

---

## Riesgos y Consideraciones

1. **Hamburger removal**: Verificar que en mobile los links "Inicio" y "La Autora" sean accesibles sin menú hamburguesa. Considerar layout responsive del header.

2. **Footer icons**: Usar `fill="currentColor"` y clases CSS para colores (`social-link--instagram`, `social-link--whatsapp`) en lugar de inline styles.

3. **Checkout flow**: El `modo` state en CheckoutPage se usa para `CheckoutForm`. Si hay perfil, saltar paso de identificación o auto-enviar.

4. **Colombia data**: La lista actual tiene 32 departamentos. Verificar contra lista oficial DANE.

5. **Admin modo_acceso**: El campo existe en BD pero no en form. Agregarlo afecta creación/edición. Opciones: "disponible" | "circulo" (no "espera").

6. **Perfil pedidos**: Los pedidos se guardan en localStorage por dispositivo. Si usuario inicia sesión en otro dispositivo, no verá pedidos previos a menos que se sincronicen con BD. Esto es limitación actual.

---

## Validación Final

- [ ] Build sin errores
- [ ] Lint sin errores nuevos
- [ ] Mobile: header muestra nav links sin hamburger, footer icons coloreados
- [ ] Desktop: header normal, footer icons coloreados
- [ ] Checkout: logueado → sin opciones invitado/crear perfil, datos pre-llenados
- [ ] Checkout: invitado → opciones normales
- [ ] Perfil: "Estado de envío" muestra referencia y estado tras compra logueado
- [ ] Perfil: "Mis Historias" muestra productos adquiridos
- [ ] Admin: formulario tiene `modo_acceso` con "Disponible" y "Círculo"のみ