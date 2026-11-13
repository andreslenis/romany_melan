# Plan: Corregir checkout Wompi + nota fabricación + hero subtitle + email de confirmación

## Contexto / síntoma (bug original)
- Compra completada en producción; Wompi confirmó el pago (transacción `1591440-1794516653-42092`, ambiente `prod`).
- Usuario redirigido a `https://www.romanymelan.com/checkout/respuesta?id=1591440-1794516653-42092&env=prod`.
- La página muestra "Pago en proceso" y no se actualiza pasados varios minutos.
- En admin aparece el pedido `RM-1794516558350-REF-B99B651D` pero sin confirmar.

## Causa raíz (confirmada)
En el panel de Wompi (producción) la **URL de eventos/webhook** está configurada como `https://romanymelan.com/checkout/respuesta` (página de cliente), en lugar del endpoint real de la API: `https://www.romanymelan.com/api/wompi/webhook`.

Consecuencia:
1. Wompi envía `transaction.updated` a `/checkout/respuesta`, que no procesa el webhook → el pedido nunca se actualiza a `APROBADO`.
2. El polling del frontend solo ejecuta 8 intentos cada 3s (~24s) y se detiene → la página queda atascada.

## Cambios solicitados (nuevos)

### N1. Nota de fabricación artesanal en el checkout
- **Archivo**: `src/app/checkout/page.tsx` (componente `OrderSummary`)
- Agregar una nota bajo el resumen del pedido indicando:
  - Las piezas son de fabricación artesanal con un tiempo de 3 a 5 días de fabricación antes del envío.
  - La guía de envío se comparte por el correo y número de teléfono otorgado.
- Ubicación sugerida: después de la nota "Envío gratis a toda Colombia | Incluye Empaque y Certificado de piezas" dentro de `order-summary`.

### N2. Cambio de hero-subtitle en el inicio
- **Archivo**: `src/app/page.tsx` (línea 84)
- Cambiar el texto de `<p className="hero-subtitle">` de `"Historias tejidas para llevar en la piel."` a `"Historias para llevar en la piel."`

### N3. Email de confirmación de pedido vía Resend
- **Archivo nuevo**: `src/lib/email/order-confirmation-template.ts`
  - Función `generateOrderConfirmationEmail(nombre: string, referencia: string): string` que devuelve el HTML del correo.
  - Constante `ORDER_CONFIRMATION_EMAIL_SUBJECT` = `"Pago confirmado ✨ Ya eres guardián(a) de una pieza con historia propia."`
  - Cuerpo del correo con el texto exacto proporcionado por el usuario (incluyendo nombre del cliente, código de referencia, 3-5 días hábiles, notificación por correo y WhatsApp, cierre "El equipo de Romany Melan" y "Historias para llevar en la piel.").
- **Archivo nuevo**: `src/lib/email/send-order-confirmation.ts`
  - Función `sendOrderConfirmationEmail({ email, nombre, referencia })` que usa `Resend` (ya instalado, `resend: ^4.0.0`) con `RESEND_API_KEY` y `RESEND_FROM_EMAIL` (verificar que existan en `.env.local` / entorno de producción).
- **Archivo modificado**: `src/lib/wompi/postpago.ts`
  - En `applyWompiTransactionToPedido`, dentro del bloque `if (claimed)` (cuando el pedido se aprueba por primera vez y se marca `post_pago_procesado_at`), llamar a `sendOrderConfirmationEmail` con `cliente_email`, `cliente_nombre` y `numero_pedido` del pedido.
  - El envío de email no debe bloquear el flujo principal: envolver en try/catch y solo loguear errores.
  - Idempotencia: como `claimed` solo es true la primera vez, el email se envía una sola vez por pedido.

## Archivos afectados (código)
1. `src/app/checkout/respuesta/page.tsx` — polling extendido (40 intentos), re-poll en `visibilitychange`, botón de verificación manual (YA IMPLEMENTADO).
2. `src/app/checkout/page.tsx` — nota de fabricación artesanal en OrderSummary.
3. `src/app/page.tsx` — hero-subtitle cambiado.
4. `src/lib/email/order-confirmation-template.ts` — nuevo, plantilla HTML del email.
5. `src/lib/email/send-order-confirmation.ts` — nuevo, función de envío vía Resend.
6. `src/lib/wompi/postpago.ts` — llamada al envío de email al confirmar pedido por primera vez.

## Archivos afectados (configuración externa)
7. Panel de Wompi > Producción > URL de eventos: cambiar a `https://www.romanymelan.com/api/wompi/webhook`.

## Riesgos
- Si la URL del webhook en Wompi no se cambia, ninguna modificación de código arreglará la confirmación automática.
- `RESEND_API_KEY` y `RESEND_FROM_EMAIL` deben estar configuradas en el entorno de producción (Vercel). Verificar antes de desplegar.
- El envío de email es best-effort: si falla, no afecta la confirmación del pedido ni el descuento de stock.

## Validación
1. Usuario cambia la URL del webhook en el panel Wompi (PROD).
2. Verificar que `RESEND_API_KEY` y `RESEND_FROM_EMAIL` estén configuradas en producción.
3. Ejecutar compra de prueba en PROD; confirmar que llega el email de confirmación al correo del cliente con el texto correcto.
4. Confirmar en Supabase que `pedidos.estado_pago = 'APROBADO'` y que el email se envió solo una vez por pedido.
5. Verificar que la nota de fabricación aparece en el checkout y que el hero-subtitle muestra "Historias para llevar en la piel."

## Preguntas abiertas
- [x] Variables de entorno de producción correctas (nombres y `WOMPI_ENV=PROD`): confirmado por el usuario.
- [x] URL del webhook en panel Wompi: usuario confirma que estaba mal apuntada; debe cambiarse a `/api/wompi/webhook`.
- [ ] ¿Están `RESEND_API_KEY` y `RESEND_FROM_EMAIL` configuradas en el entorno de producción? Pendiente de verificar.
- [ ] ¿Desea también agregar el endpoint de reconciliación para admin (D4 del plan original)? Pendiente de decisión.
