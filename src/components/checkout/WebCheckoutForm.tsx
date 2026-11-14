"use client";

import { useCallback, useState } from "react";

import {
  WOMPI_CHECKOUT_URL,
  WOMPI_ENVIRONMENT,
  WOMPI_PUBLIC_KEY,
  WOMPI_REDIRECT_URL,
  wompiIsConfigured,
} from "@/lib/wompi";

interface Props {
  total: number;
  referencia: string;
  items: {
    slug: string;
    nombre: string;
    precio: number;
    cantidad: number;
    talla: string | null;
    colorHilo: string | null;
    observaciones: string;
  }[];
  datos: {
    nombre: string;
    email: string;
    telefono: string;
    direccion: string;
    barrio: string;
    ciudad: string;
    departamento: string;
  };
}

type RespuestaPedido = {
  ok?: boolean;
  total?: number;
  amountInCents?: number;
  signature?: string;
  error?: string;
  detail?: string;
};

export default function WebCheckoutForm({ total, referencia, items, datos }: Props) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (enviando) return;

      if (!wompiIsConfigured) {
        setError("No se pudo preparar el pago. Verifica la configuración de Wompi.");
        return;
      }

      setEnviando(true);
      setError(null);

      try {
        // El servidor recalcula el total desde la base de datos, guarda el pedido
        // y devuelve el monto y la firma de integridad que se envían a Wompi.
        const res = await fetch("/api/checkout/pedido", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            numero_pedido: referencia,
            items,
            datos,
            ambiente: WOMPI_ENVIRONMENT,
          }),
        });

        const json = (await res.json().catch(() => ({}))) as RespuestaPedido;

        if (!res.ok || !json.ok) {
          if (json.error === "producto_no_disponible") {
            throw new Error(
              "Una de las piezas ya no está disponible. Revisa tu carrito antes de pagar."
            );
          }
          throw new Error(json.detail || json.error || "pedido_create_failed");
        }

        const amountInCents = Number(json.amountInCents);
        const signature = String(json.signature || "");

        if (!Number.isFinite(amountInCents) || amountInCents <= 0 || !signature) {
          throw new Error("No se pudo firmar el pago. Inténtalo de nuevo.");
        }

        const params = new URLSearchParams();
        params.set("public-key", WOMPI_PUBLIC_KEY);
        params.set("currency", "COP");
        params.set("amount-in-cents", String(amountInCents));
        params.set("reference", referencia);
        params.set("signature:integrity", signature);
        if (WOMPI_REDIRECT_URL) {
          params.set("redirect-url", WOMPI_REDIRECT_URL);
        }

        const checkoutUrl = `${WOMPI_CHECKOUT_URL}?${params.toString()}`;
        window.location.href = checkoutUrl;
      } catch (err) {
        console.error("[checkout] no se pudo preparar el pago", err);
        setError(
          err instanceof Error && err.message
            ? err.message
            : "No se pudo preparar el pago. Inténtalo de nuevo."
        );
        setEnviando(false);
      }
    },
    [referencia, items, datos, enviando]
  );

  const bloqueado = !wompiIsConfigured || Boolean(error);

  return (
    <div className="payment-widget-wrap">
      <h3 className="checkout-block-title">Pagar con Wompi</h3>
      <p className="payment-amount">
        Total a pagar{" "}
        <strong>
          $
          {total.toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0,
          })}
        </strong>
      </p>

      {bloqueado ? (
        <div className="payment-fallback">
          <p className="payment-status">
            {error || "No se pudo preparar el pago. Inténtalo de nuevo o verifica la configuración."}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <button type="submit" className="pdp-add-btn" disabled={enviando}>
            {enviando ? "Procesando…" : "Pagar con Wompi"}
          </button>
        </form>
      )}

      {error && wompiIsConfigured && (
        <button
          type="button"
          className="pdp-add-btn pdp-add-btn--outline"
          style={{ marginTop: "0.75rem" }}
          onClick={() => setError(null)}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}