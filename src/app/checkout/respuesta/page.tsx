"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense, useCallback, useRef } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { useCart } from "@/context/CartContext";

type TxState = {
  estadoPago: string | null;
  reference: string | null;
  loading: boolean;
  error: string | null;
};

const POLL_MS = 3000;
const POLL_MAX = 40;

function RespuestaContent() {
  const params = useSearchParams();
  const transactionId = params.get("id");
  const { clear } = useCart();
  const [state, setState] = useState<TxState>({
    estadoPago: null,
    reference: null,
    loading: true,
    error: null,
  });
  const [cleared, setCleared] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const forceCheckRef = useRef<(() => Promise<void>) | null>(null);

  const fetchStatus = useCallback(async (id: string) => {
    const res = await fetch(`/api/wompi/transaction?id=${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as {
      estadoPago?: string | null;
      pedido?: { numero_pedido?: string | null } | null;
      pending?: boolean;
    };
    return {
      estadoPago: data.estadoPago ?? null,
      reference: data.pedido?.numero_pedido ?? null,
      pending: Boolean(data.pending),
    };
  }, []);

  useEffect(() => {
    if (!transactionId) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const checkOnce = async () => {
      try {
        const r = await fetchStatus(transactionId);
        if (cancelled) return;
        setState({ estadoPago: r.estadoPago, reference: r.reference, loading: false, error: null });
        return r;
      } catch {
        if (cancelled) return;
        setState((s) => ({ ...s, loading: false, error: "No pudimos consultar el estado del pago." }));
        return null;
      }
    };

    const run = async () => {
      const r = await checkOnce();
      if (!r || cancelled) return;
      const pending = !r.estadoPago || r.estadoPago === "PENDIENTE" || r.pending;
      if (pending && attempts < POLL_MAX) {
        attempts += 1;
        timer = setTimeout(run, POLL_MS);
      }
    };

    const forceCheck = async () => {
      setVerifying(true);
      try {
        const r = await checkOnce();
        if (r && !cancelled) {
          const pending = !r.estadoPago || r.estadoPago === "PENDIENTE" || r.pending;
          if (pending && attempts < POLL_MAX) {
            attempts += 1;
            if (timer) clearTimeout(timer);
            timer = setTimeout(run, POLL_MS);
          }
        }
      } finally {
        setVerifying(false);
      }
    };

    run();

    forceCheckRef.current = forceCheck;

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void forceCheck();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [transactionId, fetchStatus]);

  useEffect(() => {
    if (state.estadoPago === "APROBADO" && !cleared) {
      clear();
      setCleared(true);
    }
  }, [state.estadoPago, cleared, clear]);

  const status = state.estadoPago;

  return (
    <>
      {state.loading ? (
        <p className="checkout-empty-text">Consultando el estado del pago…</p>
      ) : transactionId ? (
        <>
          <h1 className="checkout-title">
            {status === "PENDIENTE" || !status
              ? "Pago en proceso"
              : status === "APROBADO"
                ? "¡Pago confirmado!"
                : status === "DECLINED" || status === "RECHAZADO"
                  ? "Pago rechazado"
                  : status === "ERROR"
                    ? "Error en el pago"
                    : "Estado del pago"}
          </h1>
          {state.reference && (
            <p className="checkout-empty-text">
              Referencia del pedido: <strong>{state.reference}</strong>
            </p>
          )}
          <p className="checkout-empty-text">
            {status === "APROBADO"
              ? "Tu pago fue aprobado y tu pedido está siendo procesado. Te contactaremos con los detalles."
              : status === "PENDIENTE" || !status
                ? "Tu pago está siendo procesado o confirmado. Esta página se actualiza automáticamente en unos segundos."
                : status === "DECLINED" || status === "RECHAZADO"
                  ? "El pago no se pudo completar. Inténtalo nuevamente o elige otro método de pago."
                  : status === "ERROR"
                    ? "Ocurrió un error procesando el pago. Inténtalo nuevamente."
                    : `Transacción ${transactionId}`}
          </p>
          {state.error && <p className="checkout-empty-text">{state.error}</p>}
          {(status !== "APROBADO") && (
            <button
              onClick={() => void forceCheckRef.current?.()}
              disabled={verifying}
              className="cta-btn"
              style={{ marginTop: "1rem", marginRight: "0.5rem" }}
            >
              {verifying ? "Verificando…" : "Verificar estado del pago"}
            </button>
          )}
          <Link href="/coleccion/soberbia" className="cta-btn">
            Seguir explorando
          </Link>
        </>
      ) : (
        <>
          <h1 className="checkout-title">Estado del pago</h1>
          <p className="checkout-empty-text">
            No se recibió un identificador de transacción.
          </p>
          <Link href="/coleccion/soberbia" className="cta-btn">
            Volver a la colección
          </Link>
        </>
      )}
    </>
  );
}

export default function RespuestaPage() {
  return (
    <>
      <SiteHeader />
      <main className="checkout-page">
        <div className="container checkout-empty">
          <Suspense fallback={<p className="checkout-empty-text">Cargando…</p>}>
            <RespuestaContent />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
