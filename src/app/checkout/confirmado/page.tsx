"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function ConfirmadoPage() {
  const params = useSearchParams();
  const ref = params.get("ref");
  return (
    <>
      <SiteHeader />
      <main className="checkout-page">
        <div className="container checkout-empty">
          <h1 className="checkout-title">¡Gracias por tu compra!</h1>
          <p className="checkout-empty-text">
            Tu pago fue confirmado. {ref ? `Referencia: ${ref}` : ""}
          </p>
          <p className="checkout-empty-text">
            Te enviaremos un correo con los detalles de tu pedido.
          </p>
          <Link href="/coleccion/soberbia" className="cta-btn">
            Seguir explorando
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}