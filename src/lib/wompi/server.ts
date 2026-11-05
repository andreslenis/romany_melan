import crypto from "crypto";

export type WompiTxStatus =
  | "APPROVED"
  | "DECLINED"
  | "PENDING"
  | "ERROR"
  | "VOIDED";

export type EstadoPago = "PENDIENTE" | "APROBADO" | "RECHAZADO" | "ERROR";

export function mapWompiStatus(status: string): EstadoPago {
  const s = String(status || "").toUpperCase();
  if (s === "APPROVED") return "APROBADO";
  if (s === "DECLINED" || s === "RECHAZADO") return "RECHAZADO";
  if (s === "ERROR" || s === "VOIDED") return "ERROR";
  return "PENDIENTE";
}

export function getNested(obj: Record<string, unknown>, path: string): unknown {
  let current: Record<string, unknown> | undefined = obj;
  for (const key of path.split(".")) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = current[key] as Record<string, unknown> | undefined;
  }
  return current;
}

export function verifyWompiEventSignature(opts: {
  data: Record<string, unknown> | undefined;
  properties: string[];
  timestamp: number | undefined;
  providedChecksum: string | null | undefined;
  secret: string;
}): boolean {
  const { data, properties, timestamp, providedChecksum, secret } = opts;
  if (!data || !providedChecksum || properties.length === 0 || timestamp === undefined) {
    return false;
  }
  const parts: string[] = [];
  for (const prop of properties) {
    const value = getNested(data, prop);
    parts.push(value === undefined || value === null ? "" : String(value));
  }
  parts.push(String(timestamp));
  parts.push(secret);
  const concatenated = parts.join("");
  const calculated = crypto.createHash("sha256").update(concatenated).digest("hex");
  return calculated === String(providedChecksum);
}

export function wompiApiBase(): string {
  const env = (process.env.NEXT_PUBLIC_WOMPI_ENV || process.env.WOMPI_ENV || "TEST")
    .trim()
    .toUpperCase();
  return env === "PROD"
    ? "https://production.wompi.co/v1"
    : "https://sandbox.wompi.co/v1";
}

export async function fetchWompiTransaction(transactionId: string): Promise<{
  id: string;
  status: string;
  reference: string;
  amount_in_cents?: number;
  currency?: string;
} | null> {
  if (!transactionId) return null;
  const base = wompiApiBase();
  const res = await fetch(`${base}/transactions/${encodeURIComponent(transactionId)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Record<string, unknown> };
  const tx = json?.data;
  if (!tx || typeof tx !== "object") return null;
  return {
    id: String(tx.id ?? ""),
    status: String(tx.status ?? ""),
    reference: String(tx.reference ?? ""),
    amount_in_cents:
      typeof tx.amount_in_cents === "number" ? tx.amount_in_cents : undefined,
    currency: typeof tx.currency === "string" ? tx.currency : undefined,
  };
}
