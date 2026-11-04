import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { reference, amountInCents, currency } = body;
  const secret = process.env.WOMPI_INTEGRITY_SECRET || "";
  const missing = [];
  if (!reference) missing.push("reference");
  if (!amountInCents) missing.push("amountInCents");
  if (!currency) missing.push("currency");
  if (!secret) missing.push("secret");
  if (missing.length) {
    return NextResponse.json({ error: "Missing params", missing }, { status: 400 });
  }
  const cadena = `${reference}${amountInCents}${currency}${secret}`;
  const hash = crypto.createHash("sha256").update(cadena).digest("hex");
  return NextResponse.json({ signature: hash });
}