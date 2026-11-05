import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getNested, verifyWompiEventSignature } from "@/lib/wompi/server";
import { applyWompiTransactionToPedido } from "@/lib/wompi/postpago";

export async function POST(req: Request) {
  const secret = process.env.WOMPI_EVENT_SECRET || "";
  if (!secret) {
    console.error("[wompi/webhook] WOMPI_EVENT_SECRET not configured");
    return NextResponse.json({ error: "Event secret not configured" }, { status: 500 });
  }

  let body: {
    event?: string;
    data?: Record<string, unknown>;
    signature?: { properties?: string[]; checksum?: string };
    timestamp?: number;
    environment?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const { data, signature, timestamp } = body;
  const providedChecksum = signature?.checksum ?? req.headers.get("x-event-checksum");
  const properties = signature?.properties ?? [];

  const isValid = verifyWompiEventSignature({
    data,
    properties,
    timestamp,
    providedChecksum,
    secret,
  });

  if (!isValid) {
    console.warn("[wompi/webhook] invalid signature");
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const transaction = getNested((data ?? {}) as Record<string, unknown>, "transaction") as
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

  const result = await applyWompiTransactionToPedido(supabaseAdmin, {
    id: transactionId,
    status,
    reference,
  });

  if (!result.ok && !result.notFound) {
    // Error transitorio de DB: devolver 5xx para que Wompi reintente (idempotencia protege efectos).
    console.error("[wompi/webhook] processing error", result.error, reference);
    return NextResponse.json({ received: false, error: result.error }, { status: 500 });
  }

  if (result.notFound) {
    console.warn("[wompi/webhook] pedido not found for reference", reference);
  }

  return NextResponse.json(
    { received: true, estadoPago: result.estadoPago ?? null },
    { status: 200 }
  );
}
