# Plan: Corregir carga del Widget de Wompi

## Problema
El widget no carga porque la integración usa `new WompiCheckout({...})` con `container`, que no es el método soportado para abrir el checkout. Según la guía, el flujo correcto es crear una instancia `WidgetCheckout` y llamar `.open(callback)`.

## Cambios propuestos
1. Actualizar `WompiPayment.tsx` para usar `new window.WidgetCheckout(config)` y un botón "Pagar con Wompi" que llame `checkout.open(callback)`.
2. Mantener configuración obligatoria: `currency`, `amountInCents`, `reference`, `publicKey`, `signature: { integrity }`.
3. Conservar `redirectUrl` opcional.
4. Eliminar el contenedor `#wompi-widget` o mantenerlo solo informativo.
5. En el callback `open`, recibir `result.transaction` y llamar `onPagado` con estado, referencia y método.
6. Mantener manejo de error si falta firma o script no carga.

## Validación
- Pago de prueba con tarjeta test debe abrir el widget y completar transacción.
- No debe aparecer "No pudimos cargar el Widget".
- Pedido se registra en BD tras `onPagado`.