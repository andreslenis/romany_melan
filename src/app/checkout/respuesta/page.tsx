"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { supabase } from "@/lib/supabase/client";

function RespuestaContent() {
  const params = useSearchParams();
  const transactionId = params.get("id");
  const [status, setStatus] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!transactionId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase
          .from("pedidos")
          .select("numero_pedido, estado_pago, total_cop")
          .or(
            `wompi_transaction_id.eq.${transactionId},numero_pedido.eq.${transactionId}`
          )
          .single();

        if (!error && data) {
          setReference(data.numero_pedido);
          setStatus(data.estado_pago);
        }
      } catch {
        // Ignorar errores de consulta; se muestra mensaje informativo genérico.
      } finally {
        setLoading(false);
      }
    })();
  }, [transactionId]);

  return (
    <>
      {loading ? (
        <p className="checkout-empty-text">Consultando el estado del pago…</p>
      ) : transactionId ? (
        <>
          <h1 className="checkout-title">
            {status === "PENDIENTE"
              ? "Pago en proceso"
              : status === "APROBADO"
                ? "¡Pago confirmado!"
                : status === "DECLINED" || status === "RECHAZADO"
                  ? "Pago rechazado"
                  : "Estado del pago"}
          </h1>
          {reference && (
            <p className="checkout-empty-text">
              Referencia del pedido: <strong>{reference}</strong>
            </p>
          )}
          <p className="checkout-empty-text">
            {status === "APROBADO"
              ? "Tu pago fue aprobado y tu pedido está siendo procesado. Te enviaremos un correo con los detalles."
              : status === "PENDIENTE"
                ? "Tu pago está siendo procesado. Te notificaremos una vez se confirme el estado."
                : status === "DECLINED" || status === "RECHAZADO"
                  ? "El pago no se pudo completar. Inténtalo nuevamente o elige otro método de pago."
                  : "Transacción " + transactionId}
          </p>
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
