"use client";

import { useEffect, useRef, useState } from "react";

import {
  loadWompiScript,
  METODOS_PAGO,
  WOMPI_ENVIRONMENT,
  WOMPI_PUBLIC_KEY,
  WOMPI_REDIRECT_URL,
  wompiIsConfigured,
  type WompiTransaccion,
} from "@/lib/wompi";
import { formatCOP } from "@/utils/format";

export interface ResultadoPago {
  referencia: string;
  estado: WompiTransaccion["status"];
  metodo: string;
}

interface Props {
  total: number;
  referencia: string;
  onPagado: (resultado: ResultadoPago) => void;
}

export default function WompiPayment({ total, referencia, onPagado }: Props) {
  const [estadoWidget, setEstadoWidget] = useState<
    "idle" | "cargando" | "listo" | "error"
  >(wompiIsConfigured ? "cargando" : "idle");
  const [signature, setSignature] = useState<string | null>(null);
  useEffect(() => {
    if (!wompiIsConfigured) return;
    (async () => {
      try {
        const res = await fetch("/api/wompi/integrity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: referencia, amountInCents: Math.round(total * 100), currency: "COP" }),
        });
        const data = await res.json();
        if (data.signature) setSignature(data.signature);
      } catch {}
    })();
  }, [referencia, total]);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<string>(
    METODOS_PAGO[0]?.id || "card"
  );

  const checkoutRef = useRef<unknown>(null);

  useEffect(() => {
    if (!wompiIsConfigured) return;
    if (!signature) return;

    let cancelado = false;

    (async () => {
      const cargado = await loadWompiScript();
      if (cancelado) return;
      if (!cargado || !window.WidgetCheckout) {
        setEstadoWidget("error");
        return;
      }
      try {
        const checkout = new window.WidgetCheckout({
          locale: "es-CO",
          currency: "COP",
          amountInCents: Math.round(total * 100),
          reference: referencia,
          publicKey: WOMPI_PUBLIC_KEY,
          signature: { integrity: signature },
          ...(WOMPI_REDIRECT_URL ? { redirectUrl: WOMPI_REDIRECT_URL } : {}),
        });
        checkoutRef.current = checkout;
        setEstadoWidget("listo");
      } catch {
        setEstadoWidget("error");
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [referencia, total, signature]);

  const metodoLabelActual =
    METODOS_PAGO.find((m) => m.id === metodoSeleccionado)?.label ||
    METODOS_PAGO[0]?.label ||
    "Pago en línea";

  return (
    <div className="payment-panel">
      <div className="payment-methods">
        <h3 className="checkout-block-title">Método de pago</h3>
        <p className="payment-methods-intro">
          Selecciona cómo quieres pagar. Las opciones se procesan a través de
          Wompi de forma segura.
        </p>
        <div className="payment-method-selector">
          {METODOS_PAGO.map((metodo) => (
            <label
              key={metodo.id}
              className={`payment-method-option ${
                metodoSeleccionado === metodo.id ? "active" : ""
              }`}
            >
              <input
                type="radio"
                name="metodo-pago"
                value={metodo.id}
                checked={metodoSeleccionado === metodo.id}
                onChange={() => setMetodoSeleccionado(metodo.id)}
              />
              <span className="payment-method-icon" aria-hidden="true">
                {metodo.id === "card" && "▭"}
                {metodo.id === "pse" && "⇄"}
                {metodo.id === "nequi" && "◉"}
                {metodo.id === "bancolombia" && "🏦"}
              </span>
              <span className="payment-method-body">
                <span className="payment-method-label">{metodo.label}</span>
                <span className="payment-method-desc">{metodo.descripcion}</span>
                <span className="payment-method-detail">{metodo.detalle}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="payment-amount">
          Total a pagar <strong>{formatCOP(total)}</strong>
        </p>
      </div>

      <div className="payment-widget-wrap">
        {wompiIsConfigured ? (
          <>
            <h3 className="checkout-block-title">Pagar con Wompi</h3>
            <p className="payment-status">
              Método seleccionado: <strong>{metodoLabelActual}</strong>
            </p>
            {estadoWidget === "cargando" && (
              <p className="payment-status">Cargando el Widget de Wompi…</p>
            )}
            {estadoWidget === "error" && (
              <p className="payment-status payment-status--error">
                No pudimos cargar el Widget de Wompi. Verifica la configuración
                de Wompi.
              </p>
            )}
             <div id="wompi-widget" className="wompi-widget" />
             {estadoWidget === "listo" && (
               <button
                 type="button"
                 className="pdp-add-btn"
                 onClick={() => {
                   const checkout = checkoutRef.current as { open: (cb: (r: { transaction: unknown }) => void) => void } | null;
                   if (!checkout) return;
                   checkout.open((result: unknown) => {
                     const transaction = (result as { transaction: { reference?: string; status: ResultadoPago["estado"]; payment_method?: { type?: string } } }).transaction;
                     const metodoLabel =
                       METODOS_PAGO.find((m) => m.id === transaction.payment_method?.type)?.label ??
                       METODOS_PAGO.find((m) => m.id === metodoSeleccionado)?.label ??
                       "Pago en línea";
                     onPagado({
                       referencia: transaction.reference || referencia,
                       estado: transaction.status,
                       metodo: metodoLabel,
                     });
                   });
                 }}
               >
                 Pagar con Wompi
               </button>
             )}
            {estadoWidget === "error" && (
              <button
                type="button"
                className="pdp-add-btn"
                  onClick={() => window.location.reload()}
              >
                Continuar
              </button>
            )}
          </>
        ) : (
          <div className="payment-fallback">
            <h3 className="checkout-block-title">Pagar con Wompi</h3>
            <p className="payment-status">
              No hay clave pública de Wompi configurada. Añádela en{" "}
              <code>.env.local</code> como{" "}
              <code>NEXT_PUBLIC_WOMPI_PUBLIC_KEY</code> para habilitar el pago con
              Wompi.
            </p>
            <p className="payment-fallback-note">
              Entorno {WOMPI_ENVIRONMENT} · Referencia {referencia}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
