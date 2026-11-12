import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { generateWelcomeEmail, WELCOME_EMAIL_SUBJECT } from "@/lib/email/welcome-template";

export const dynamic = "force-dynamic";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY no configurada");
  }
  return new Resend(apiKey);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@romanymelan.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, nombre } = body;

    if (!email || !nombre) {
      return NextResponse.json(
        { success: false, error: "Email y nombre son requeridos" },
        { status: 400 }
      );
    }

    const resend = getResendClient();

    const html = generateWelcomeEmail(nombre);

    const { data, error } = await resend.emails.send({
      from: `Romany Melan <${FROM_EMAIL}>`,
      to: [email],
      subject: WELCOME_EMAIL_SUBJECT,
      html,
    });

    if (error) {
      console.error("[welcome-email] Error enviando email:", error);
      return NextResponse.json(
        { success: false, error: "Error enviando email" },
        { status: 500 }
      );
    }

    console.log("[welcome-email] Email enviado exitosamente:", data?.id);
    return NextResponse.json({ success: true, id: data?.id });
  } catch (e) {
    console.error("[welcome-email] Error inesperado:", e);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}