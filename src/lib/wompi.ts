export const WOMPI_CHECKOUT_URL = "https://checkout.wompi.co/p/";

export const WOMPI_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY?.trim() ?? "";

export const WOMPI_ENVIRONMENT: "TEST" | "PROD" =
  process.env.NEXT_PUBLIC_WOMPI_ENV?.trim().toUpperCase() === "PROD"
    ? "PROD"
    : "TEST";

export const WOMPI_REDIRECT_URL =
  process.env.NEXT_PUBLIC_WOMPI_REDIRECT_URL?.trim() ?? "";

export const wompiIsConfigured = WOMPI_PUBLIC_KEY.length > 0;

export interface WompiTransaccion {
  id: string;
  status: "APPROVED" | "PENDING" | "DECLINED" | "ERROR";
  reference: string;
  amount_in_cents: number;
  currency: string;
  payment_method?: { type?: string; id?: string };
  created_at?: string;
}

export interface WebCheckoutParams {
  publicKey: string;
  currency: string;
  amountInCents: number;
  reference: string;
  signature: string;
  redirectUrl?: string;
  expirationTime?: string;
}
