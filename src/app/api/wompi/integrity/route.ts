import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { reference, amountInCents, currency } = body;
  const secret = process.env.WOMPI_INTEGRITY_SECRET || "";
  if (!reference || !amountInCents || !currency || !secret) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }
  const cadena = `${reference}${amountInCents}${currency}${secret}`;
  const hash = crypto.createHash("sha256").update(cadena).digest("hex");
  return NextResponse.json({ signature: hash });
}