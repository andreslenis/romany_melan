"use client";

import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase/client";
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

export default function WebCheckoutForm({ total, referencia, items, datos }: Props) {
  const [signature, setSignature] = useState<string | null>(null);
  const [loading, setLoading] = useState(wompiIsConfigured);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!wompiIsConfigured) {
      setError(true);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/wompi/integrity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference: referencia,
            amountInCents: Math.round(total * 100),
            currency: "COP",
          }),
        });
        const data = await res.json();
        if (data.signature) {
          setSignature(data.signature);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [referencia, total]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!signature) return;

      const amountInCents = Math.round(total * 100);

      try {
        await supabase.from("pedidos").insert({
          numero_pedido: referencia,
          cliente_nombre: datos.nombre,
          cliente_email: datos.email,
          cliente_telefono: datos.telefono,
          direccion_envio: datos,
          items: items,
          total_cop: total,
          wompi_transaction_id: null,
          estado_pago: "PENDIENTE",
          metodo_pago: "web_checkout",
          ambiente: WOMPI_ENVIRONMENT,
        });
      } catch {
        // Si falla la creación local, el webhook aún puede registrar la transacción.
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
      console.log("[wompi/checkout] redirectUrl:", checkoutUrl);
      window.location.href = checkoutUrl;
    },
    [referencia, total, signature, items, datos]
  );

  if (error) {
    return (
      <div className="payment-fallback">
        <h3 className="checkout-block-title">Pagar con Wompi</h3>
        <p className="payment-status">
          No se pudo configurar el pago con Wompi. Verifica la configuración de
          Wompi.
        </p>
      </div>
    );
  }

  if (loading || !signature) {
    return (
      <div className="payment-fallback">
        <h3 className="checkout-block-title">Pagar con Wompi</h3>
        <p className="payment-status">Cargando configuración de pago…</p>
      </div>
    );
  }

  const amountInCents = Math.round(total * 100);

  return (
    <form action={WOMPI_CHECKOUT_URL} method="GET" onSubmit={handleSubmit}>
      <input type="hidden" name="public-key" value={WOMPI_PUBLIC_KEY} />
      <input type="hidden" name="currency" value="COP" />
      <input type="hidden" name="amount-in-cents" value={String(amountInCents)} />
      <input type="hidden" name="reference" value={referencia} />
      <input type="hidden" name="signature:integrity" value={signature} />
      {WOMPI_REDIRECT_URL && (
        <input type="hidden" name="redirect-url" value={WOMPI_REDIRECT_URL} />
      )}
      <div className="payment-widget-wrap">
        <h3 className="checkout-block-title">Pagar con Wompi</h3>
        <p className="payment-amount">
          Total a pagar <strong>${total.toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
          })}</strong>
        </p>
        <button type="submit" className="pdp-add-btn">
          Pagar con Wompi
        </button>
      </div>
    </form>
  );
}
