import { NextResponse } from "next/server";
import crypto from "crypto";

function getNested(obj: Record<string, unknown>, path: string): unknown {
  let current: Record<string, unknown> | undefined = obj;
  for (const key of path.split(".")) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = current[key] as Record<string, unknown> | undefined;
  }
  return current;
}

export async function POST(req: Request) {
  const secret = process.env.WOMPI_EVENT_SECRET || "";
  if (!secret) {
    return NextResponse.json({ error: "Event secret not configured" }, { status: 500 });
  }

  let body: { event?: string; data?: Record<string, unknown>; signature?: { properties?: string[]; checksum?: string }; timestamp?: number; environment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const { data, signature, timestamp } = body;
  const providedChecksum =
    signature?.checksum ?? req.headers.get("x-event-checksum");
  const properties = signature?.properties ?? [];

  let isValid = false;

  if (data && providedChecksum && properties.length > 0 && timestamp !== undefined) {
    const parts: string[] = [];
    for (const prop of properties) {
      const value = getNested(data as Record<string, unknown>, prop);
      parts.push(value === undefined || value === null ? "" : String(value));
    }
    parts.push(String(timestamp));
    parts.push(secret);

    const concatenated = parts.join("");
    const calculated = crypto.createHash("sha256").update(concatenated).digest("hex");
    isValid = calculated === providedChecksum;
  }

  if (!isValid) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const transaction = (data as Record<string, unknown> | undefined)?.["transaction"] as
    | Record<string, unknown>
    | undefined;
  if (!transaction) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const status = String(transaction["status"] ?? "");
  const reference = String(transaction["reference"] ?? "");
  const transactionId = String(transaction["id"] ?? "");

  if (!reference) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    const { supabaseAdmin } = await import("@/lib/supabase/server");
    await supabaseAdmin
      .from("pedidos")
      .update({
        estado_pago: status === "APPROVED" ? "APROBADO" : status === "DECLINED" || status === "RECHAZADO" ? "RECHAZADO" : status === "ERROR" ? "ERROR" : "PENDIENTE",
        wompi_transaction_id: transactionId || null,
        wompi_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("numero_pedido", reference);
  } catch {
    // Si falla la actualización, Wompi reintentará el webhook (máximo 3 veces).
    // Siempre respondemos 200 para evitar reintentos innecesarios por error de nuestro lado.
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
