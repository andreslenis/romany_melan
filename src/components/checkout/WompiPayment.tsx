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
          environment: WOMPI_ENVIRONMENT,
          publicKey: WOMPI_PUBLIC_KEY,
          container: "#wompi-widget",
          ...(WOMPI_REDIRECT_URL ? { redirectUrl: WOMPI_REDIRECT_URL } : {}),
          onCompleted: ({ transaction }) => {
            onPagado({
              referencia: transaction.reference || referencia,
              estado: transaction.status,
              metodo: METODOS_PAGO.find(
                (m) => m.id === transaction.payment_method?.type
              )?.label ?? "Pago en línea",
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
  }, [referencia, onPagado]);

  return (
    <div className="payment-panel">
      <div className="payment-methods">
        <h3 className="checkout-block-title">Método de pago</h3>
        <p className="payment-methods-intro">
          Selecciona cómo quieres pagar. Las opciones provienen del Widget de
          Wompi y se procesan en un entorno seguro.
        </p>
        <ul className="payment-methods-list">
          {METODOS_PAGO.map((metodo) => (
            <li className="payment-method" key={metodo.id}>
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
            </li>
          ))}
        </ul>
        <p className="payment-amount">
          Total a pagar <strong>{formatCOP(total)}</strong>
        </p>
      </div>

      <div className="payment-widget-wrap">
        {wompiIsConfigured ? (
          <>
            <h3 className="checkout-block-title">Paga con Wompi</h3>
            {estadoWidget === "cargando" && (
              <p className="payment-status">Cargando el Widget de Wompi…</p>
            )}
            {estadoWidget === "error" && (
              <p className="payment-status payment-status--error">
                No pudimos cargar el Widget de Wompi. Verifica la clave pública en
                las variables de entorno o usa el modo de prueba.
              </p>
            )}
            <div id="wompi-widget" className="wompi-widget" />
            {estadoWidget === "error" && (
              <button
                type="button"
                className="pdp-add-btn"
                onClick={() =>
                  onPagado({
                    referencia,
                    estado: "APPROVED",
                    metodo: METODOS_PAGO[0].label,
                  })
                }
              >
                Continuar en modo prueba
              </button>
            )}
          </>
        ) : (
          <div className="payment-fallback">
            <h3 className="checkout-block-title">Wompi (modo demostración)</h3>
            <p className="payment-status">
              Falta configurar la clave pública de Wompi. Añádela en
              <code>.env.local</code> como{" "}
              <code>NEXT_PUBLIC_WOMPI_PUBLIC_KEY</code> y reinicia el servidor
              para activar el Widget real con los métodos de pago de Wompi.
            </p>
            <button
              type="button"
              className="pdp-add-btn"
              onClick={() =>
                onPagado({
                  referencia,
                  estado: "APPROVED",
                  metodo: METODOS_PAGO[0].label,
                })
              }
            >
              Simular pago de {formatCOP(total)}
            </button>
            <p className="payment-fallback-note">
              Entorno {WOMPI_ENVIRONMENT} · Referencia {referencia}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
