"use client";

import { useEffect, useState } from "react";

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
  const [metodoSeleccionado, setMetodoSeleccionado] = useState<string>(
    METODOS_PAGO[0]?.id || "card"
  );

  useEffect(() => {
    if (!wompiIsConfigured) return;

    let cancelado = false;

    (async () => {
      const cargado = await loadWompiScript();
      if (cancelado) return;

      if (!cargado || !window.WompiCheckout) {
        setEstadoWidget("error");
        return;
      }

      try {
        new window.WompiCheckout({
          locale: "es-CO",
          currency: "COP",
          environment: WOMPI_ENVIRONMENT === "PROD" ? "production" : "test",
          publicKey: WOMPI_PUBLIC_KEY,
          container: "#wompi-widget",
          ...(WOMPI_REDIRECT_URL ? { redirectUrl: WOMPI_REDIRECT_URL } : {}),
          onCompleted: ({ transaction }) => {
            const metodoLabel =
              METODOS_PAGO.find(
                (m) => m.id === transaction.payment_method?.type
              )?.label ??
              METODOS_PAGO.find((m) => m.id === metodoSeleccionado)?.label ??
              "Pago en línea";
            onPagado({
              referencia: transaction.reference || referencia,
              estado: transaction.status,
              metodo: metodoLabel,
            });
          },
        });
        setEstadoWidget("listo");
      } catch {
        setEstadoWidget("error");
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [referencia, onPagado, metodoSeleccionado]);

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
