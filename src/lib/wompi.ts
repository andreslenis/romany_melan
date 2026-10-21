export const WOMPI_SCRIPT_URL = "https://checkout.wompi.co/widget.js";

export const WOMPI_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY?.trim() ?? "";

export const WOMPI_ENVIRONMENT: "TEST" | "PROD" =
  process.env.NEXT_PUBLIC_WOMPI_ENV?.trim().toUpperCase() === "PROD"
    ? "PROD"
    : "TEST";

export const WOMPI_REDIRECT_URL =
  process.env.NEXT_PUBLIC_WOMPI_REDIRECT_URL?.trim() ?? "";

export const wompiIsConfigured = WOMPI_PUBLIC_KEY.length > 0;

export interface MetodoPago {
  id: string;
  label: string;
  descripcion: string;
  detalle: string;
}

export const METODOS_PAGO: MetodoPago[] = [
  {
    id: "card",
    label: "Tarjeta de Crédito / Débito",
    descripcion: "Visa, Mastercard, American Express y débito en línea.",
    detalle: "Aprobación inmediata, 3 y 6 cuotas sin interés.",
  },
  {
    id: "pse",
    label: "PSE (Transferencia bancaria)",
    descripcion: "Paga directo desde tu banco con PSE.",
    detalle: "Confirmación en pocos minutos según tu banco.",
  },
  {
    id: "nequi",
    label: "Nequi / Billeteras digitales",
    descripcion: "Nequi, Daviplata, Movii y Tpago.",
    detalle: "Pago inmediato desde tu celular.",
  },
  {
    id: "bancolombia",
    label: "Bancolombia / Corresponsal",
    descripcion: "Corresponsales bancarios y Bancolombia.",
    detalle: "Paga en efectivo o por transferencia en la oficina.",
  },
];

export interface WompiTransaccion {
  id: string;
  status: "APPROVED" | "PENDING" | "DECLINED" | "ERROR";
  reference: string;
  amount_in_cents: number;
  currency: string;
  payment_method?: { type?: string; id?: string };
  created_at?: string;
}

export interface WompiConfig {
  locale: string;
  currency: string;
  environment: "TEST" | "PROD";
  publicKey: string;
  container: string;
  redirectUrl?: string;
  onCompleted?: (response: { transaction: WompiTransaccion }) => void;
  onError?: (error: unknown) => void;
}

declare global {
  interface Window {
    WompiCheckout?: new (config: WompiConfig) => void;
  }
}

let scriptPromise: Promise<boolean> | null = null;

export function loadWompiScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.WompiCheckout) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${WOMPI_SCRIPT_URL}"]`
    );
    const onReady = () => resolve(Boolean(window.WompiCheckout));

    if (existing) {
      existing.addEventListener("load", onReady);
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = WOMPI_SCRIPT_URL;
    script.async = true;
    script.onload = onReady;
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return scriptPromise;
}
