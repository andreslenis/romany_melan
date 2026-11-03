# Plan: Fix carrito, checkout y pagos Wompi

## Objetivo
Corregir los tres problemas reportados:
1. En el carrito aparecen `$ NaN` (precio unitario y subtotal).
2. En checkout/datos de envío, cuando se elige "crear perfil" debe haber un botón para crearlo y volver al checkout con la sesión iniciada.
3. En pago con Wompi permitir elegir método de pago, quitar "modo demostración", y permitir elegir pagar con Wompi siguiendo la lógica del servicio.

## Análisis actual

### 1) Carrito `$ NaN`
- `src/app/producto/[slug]/page.tsx:153-165` pasa `precio: producto.precio` al `addItem`. 
- `src/app/coleccion/[slug]/CollectionClient.tsx` y `SoberbiaClient.tsx` usan `precio_cop` desde Supabase.
- `src/lib/types.ts:33` define `Producto.precioFormato` pero no está claro cómo se mapea; `CartItem.precio` es `number` (requerido).
- En Supabase schema `productos.precio_cop numeric`. En páginas de colección se lee `precio_cop`. En PDP se lee desde Supabase como `precio` o `precio_cop` (tipo `DBProd` tiene ambos).
- Cuando `producto.precio` viene undefined (común si solo existe `precio_cop`), se guarda `undefined`/`NaN` y `formatCOP` muestra `$ NaN`. También puede pasar en otros flujos.
- `CartContext` calcula `subtotal` con `i.precio` sin validación.

### 2) Checkout crear perfil
- `src/components/checkout/CheckoutForm.tsx`: opción "Crear mi Perfil en el Círculo Romany Melan" (modo `miembro`). 
- `src/app/checkout/page.tsx:40-56`: si modo es `miembro`, intenta `registrar({...})` pero `ProfileContext.registrar` lanza error si no hay `password` (linea ~140). Comentario dice "El perfil requiere contraseña; el usuario puede crearlo en /crear-perfil". 
- No hay botón para ir a crear perfil desde checkout. Usuario queda atascado o el registro silenciosamente falla.

### 3) Wompi pagos
- `src/components/checkout/WompiPayment.tsx` muestra lista de métodos (`METODOS_PAGO`) pero no permite selección interactiva; widget se carga siempre. 
- Si `wompiIsConfigured` es false, muestra bloque "Wompi (modo demostración)" con botón "Simular pago" que llama `onPagado` con estado APPROVED y primer método. 
- Requisito: poder elegir método de pago, quitar "modo demostración", permitir elegir pagar con Wompi siguiendo lógica del servicio.

## Cambios propuestos

### 1) Corregir precios en carrito
**Archivos a modificar:**
- `src/app/producto/[slug]/page.tsx`: al construir el objeto para `addItem`, normalizar precio: `const precio = producto.precio ?? (producto as any).precio_cop ?? 0;` y asegurar número válido. También considerar `precioFormato` si viene, pero numérico es lo que usa el carrito.
- `src/app/coleccion/[slug]/CollectionClient.tsx`: al añadir al carrito (si lo hace) o al pasar datos, normalizar precio desde `precio_cop`.
- `src/app/coleccion/soberbia/SoberbiaClient.tsx`: idem.
- `src/context/CartContext.tsx`: hacer defensivo - al calcular subtotal/guardar, filtrar/coercear `Number(i.precio)` y tratar NaN como 0. También podría sanear items al hidratar.
- `src/lib/types.ts` (opcional): aclarar que `precio` puede venir de distintas fuentes; no obligatorio cambiar tipo.

**Validación:** agregar al carrito desde PDP/colección, verificar precio unitario y subtotal con `formatCOP` (sin `$ NaN`).

### 2) Botón para crear perfil desde checkout
**Archivos a modificar:**
- `src/components/checkout/CheckoutForm.tsx`: cuando `modo === "miembro"`, mostrar botón/enlace "Crear perfil en el Círculo" que lleve a `/crear-perfil?return=/checkout`. También puede mostrar mensaje explicativo.
- `src/app/crear-perfil/page.tsx`: leer `return` param y pasar a `CrearPerfil` o redirigir tras crear perfil. 
- `src/components/profile/CrearPerfil.tsx`: aceptar `onSuccess` o `redirectTo` prop; tras registro exitoso, redirigir a `redirectTo` si viene en query/localStorage. También puede usar router.
- `src/app/checkout/page.tsx`: al volver, mantener estado? Los datos del formulario ya están en estado (`datos`) - al navegar y volver se mantienen si no se recarga; mejor usar router.push con returnTo. También tras registro, ProfileContext actualiza perfil; checkout puede detectar perfil y proceder.

**Flujo:** usuario marca "Crear mi Perfil" en checkout → ve botón "Ir a crear perfil" → va a `/crear-perfil?return=/checkout` → crea perfil (con contraseña) → redirige a `/checkout` → checkout detecta `perfil` existente, continúa con datos precargados si coincide email/nombre.

### 3) Wompi: elegir método, quitar "modo demostración", seguir lógica del servicio
**Archivos a modificar:**
- `src/components/checkout/WompiPayment.tsx`:
  - Permitir seleccionar método de pago (radio/selector) entre `METODOS_PAGO`. Guardar `metodoSeleccionado` en estado.
  - Quitar textos "Wompi (modo demostración)" y referencias a "modo demostración". Cambiar títulos a neutrales como "Pago" o "Pagar con Wompi".
  - Cuando no hay clave pública configurada: NO mostrar "modo demostración" con simulación automática; mostrar mensaje claro "Configura Wompi para habilitar el pago" y deshabilitar botón de pago real, o seguir lógica del servicio (quizás mostrar widget solo si configurado; si no, bloquear pago con mensaje). Pero requisito dice "permitir elegir entre pagar con wompi lo cual deberia seguir la logica del servicio" - hay que mantener lógica de widget cuando configurado.
  - Pasar método seleccionado al callback `onPagado` (ya lo hace usando `transaction.payment_method` o fallback; pero permitir override).
  - Actualizar UI para que usuario elija método explícitamente.
- `src/lib/wompi.ts`: posiblemente extender tipos si se necesita pasar método al widget (Wompi widget permite ciertos configs, pero normalmente el usuario elige en widget; requisito dice "debe poder elegirse el metodo de pago" - puede ser pre-selección o selección explícita antes de abrir widget).

**Consideraciones:** mantener compatibilidad con flujo actual. Cuando configurado, mostrar selector + widget. Cuando no configurado, mostrar estado sin "modo demostración" y sin botón de simulación que engañe - seguir lógica del servicio (probablemente requerir configuración).

## Pasos de implementación
1. **Investigar datos reales** - revisar cómo llegan precios desde BD en PDP/colección para confirmar fuentes.
2. **Fix carrito precios** - normalizar en addItem y hacer defensivo en CartContext/formatting.
3. **Fix checkout perfil** - agregar navegación a crear perfil con return URL y manejo post-registro.
4. **Fix Wompi UI/flujo** - selector de método, quitar texto demo, ajustar comportamiento sin config.
5. **Probar flujos** - carrito, checkout con/sin perfil, pago.

## Riesgos
- Cambios en tipos pueden afectar otros componentes.
- Navegación con return URL debe limpiar estado correctamente.
- Wompi widget comportamiento varía según config; hay que ser cuidadoso de no romper integración existente.
- Precios desde distintas fuentes (precio vs precio_cop) necesitan mapeo consistente.

## Validación
- Añadir producto al carrito → precio unitario y subtotal numéricos correctos.
- En checkout, seleccionar "crear perfil" → aparece botón para ir a crear perfil → crear cuenta → vuelve a checkout con sesión.
- En paso de pago, poder elegir método, sin texto "modo demostración", flujo con Wompi sigue lógica del servicio.
