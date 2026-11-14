import crypto from "crypto";

/**
 * Firma de integridad de Wompi: sha256(referencia + monto + moneda + secreto).
 * El monto siempre lo decide el servidor (ver lib/pricing-server.ts).
 */
export function firmarIntegridad(opts: {
  reference: string;
  amountInCents: number;
  currency: string;
  secret?: string;
}): string | null {
  const secret = opts.secret ?? process.env.WOMPI_INTEGRITY_SECRET ?? "";
  if (!secret) return null;
  const cadena = `${opts.reference}${opts.amountInCents}${opts.currency}${secret}`;
  return crypto.createHash("sha256").update(cadena).digest("hex");
}