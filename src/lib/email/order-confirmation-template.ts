function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateOrderConfirmationEmail(nombre: string, referencia: string): string {
  const nombreEscapado = escapeHtml(nombre);
  const referenciaEscapada = escapeHtml(referencia);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pago confirmado — Romany Melan</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="text-align: center; padding-bottom: 32px; border-bottom: 1px solid #eeeeee;">
              <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.5px;">Pago confirmado ✨ Ya eres guardián(a) de una pieza con historia propia.</h1>
              <p style="margin: 0; font-size: 16px; color: #666666;">Gracias por confiar en Romany Melan.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 0;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">Hola, <strong>${nombreEscapado}</strong>:</p>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">Queremos confirmarte que tu pago ha sido procesado con éxito. ¡Gracias por confiar en nosotros! Desde este momento, te has convertido oficialmente en guardián o guardiana de una pieza de joyería con historia propia, creada especialmente para ti.</p>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;"><strong>Código de referencia de tu pedido:</strong> ${referenciaEscapada}</p>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;"><strong>¿Qué sigue ahora?</strong></p>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">Debido a que nuestras piezas de alta joyería artesanal son elaboradas enteramente a mano, cada creación requiere un riguroso proceso en taller de 3 a 5 días hábiles antes de estar lista.</p>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">Una vez tu pedido sea despachado, te notificaremos de inmediato por este medio y a través de WhatsApp con tu número de guía para que puedas hacerle seguimiento en tiempo real hasta la puerta de tu hogar.</p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #333333;">Si tienes alguna duda o deseas conocer más sobre el cuidado de tu nueva pieza, estamos a tu total disposición en nuestros canales oficiales.</p>
              <p style="margin: 0 0 8px 0; font-size: 16px; color: #333333;">Con distinción,</p>
              <p style="margin: 0 0 8px 0; font-size: 16px; color: #333333; font-weight: 600;">El equipo de Romany Melan</p>
              <p style="margin: 16px 0 0 0; font-size: 14px; color: #999999; font-style: italic;">Historias para llevar en la piel.</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 32px; border-top: 1px solid #eeeeee; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #aaaaaa;">© 2026 Romany Melan. Todos los derechos reservados.</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #aaaaaa;"><a href="https://www.romanymelan.com" style="color: #aaaaaa; text-decoration: underline;">www.romanymelan.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export const ORDER_CONFIRMATION_EMAIL_SUBJECT = "Pago confirmado ✨ Ya eres guardián(a) de una pieza con historia propia.";
