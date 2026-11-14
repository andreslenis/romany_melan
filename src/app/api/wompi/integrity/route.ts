import { NextRequest, NextResponse } from "next/server";

import { firmarIntegridad } from "@/lib/wompi/integrity";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { reference, amountInCents, currency } = body;

  const missing = [];
  if (!reference) missing.push("reference");
  if (!amountInCents) missing.push("amountInCents");
  if (!currency) missing.push("currency");
  if (!process.env.WOMPI_INTEGRITY_SECRET) missing.push("secret");
  if (missing.length) {
    return NextResponse.json({ error: "Missing params", missing }, { status: 400 });
  }

  const signature = firmarIntegridad({
    reference: String(reference),
    amountInCents: Number(amountInCents),
    currency: String(currency),
  });

  if (!signature) {
    return NextResponse.json({ error: "Missing params", missing: ["secret"] }, { status: 400 });
  }

  return NextResponse.json({ signature });
}