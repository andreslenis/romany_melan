function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/'/g, "'");
}

export function generateWelcomeEmail(nombre: string): string {
  const nombreEscapado = escapeHtml(nombre);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenida al Círculo Romany Melan</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="text-align: center; padding-bottom: 32px; border-bottom: 1px solid #eeeeee;">
              <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.5px;">Bienvenida al Círculo Romany Melan ✨</h1>
              <p style="margin: 0; font-size: 16px; color: #666666;">Tu historia comienza aquí.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 0;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">Hola, <strong>${nombreEscapado}</strong>:</p>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333333;">Es un honor darte la bienvenida a El Círculo Romany Melan.</p>
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #333333;">Más que una cuenta en nuestra plataforma, has abierto la puerta a un espacio donde el tiempo se detiene y la alta joyería artesanal cobra vida. Cada pieza que creamos —ya sea en nuestra Línea Origen o Singular— nace de horas de dedicación, entrelazando hilos de alta tenacidad, oro laminado y gemas naturales en un ritual de precisión milimétrica.</p>
              
              <p style="margin: 0 0 16px 0; font-size: 16px; color: #333333; font-weight: 600;">Como miembro de nuestro círculo, ahora tienes acceso exclusivo a:</p>
              
              <ul style="margin: 0 0 24px 0; padding-left: 24px; font-size: 16px; color: #333333;">
                <li style="margin-bottom: 12px;">Lanzamientos anticipados de nuestras colecciones inspiradas en los detalles más sutiles y memorables.</li>
                <li style="margin-bottom: 12px;">Piezas de edición limitada, diseñadas para quienes eligen llevar una certeza silenciosa sobre la piel.</li>
                <li style="margin-bottom: 12px;">Atención y asesoría personalizada directamente a través de nuestros canales oficiales.</li>
              </ul>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://www.romanymelan.com" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 500;">Explorar la colección inaugural</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 24px; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 8px 0; font-size: 16px; color: #333333;">Gracias por permitirnos tejer esta historia contigo.</p>
              <p style="margin: 0 0 8px 0; font-size: 16px; color: #333333;">Con distinción,</p>
              <p style="margin: 0 0 8px 0; font-size: 16px; color: #333333; font-weight: 600;">El equipo de Romany Melan</p>
              <p style="margin: 16px 0 0 0; font-size: 14px; color: #999999; font-style: italic;">Tejer esta historia en tu piel.</p>
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

export const WELCOME_EMAIL_SUBJECT = "Bienvenida al Círculo Romany Melan ✨ Tu historia comienza aquí.";