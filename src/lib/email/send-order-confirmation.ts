import { Resend } from "resend";
import { generateOrderConfirmationEmail, ORDER_CONFIRMATION_EMAIL_SUBJECT } from "./order-confirmation-template";

type SendOrderConfirmationEmailInput = {
  email: string;
  nombre: string;
  referencia: string;
};

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY no configurada");
  }
  return new Resend(apiKey);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@romanymelan.com";

export async function sendOrderConfirmationEmail(input: SendOrderConfirmationEmailInput): Promise<{ ok: boolean; error?: string; id?: string }> {
  const { email, nombre, referencia } = input;

  if (!email || !nombre || !referencia) {
    return { ok: false, error: "Email, nombre y referencia son requeridos" };
  }

  try {
    const resend = getResendClient();

    const html = generateOrderConfirmationEmail(nombre, referencia);

    const { data, error } = await resend.emails.send({
      from: `Romany Melan <${FROM_EMAIL}>`,
      to: [email],
      subject: ORDER_CONFIRMATION_EMAIL_SUBJECT,
      html,
    });

    if (error) {
      console.error("[order-confirmation] Error enviando email:", error);
      return { ok: false, error: "Error enviando email" };
    }

    console.log("[order-confirmation] Email enviado exitosamente:", data?.id);
    return { ok: true, id: data?.id };
  } catch (e) {
    console.error("[order-confirmation] Error inesperado:", e);
    return { ok: false, error: "Error interno del servidor" };
  }
}
