"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import CheckoutForm, {
  datosIniciales,
  type ModoRegistro,
} from "@/components/checkout/CheckoutForm";
import WompiPayment, {
  type ResultadoPago,
} from "@/components/checkout/WompiPayment";
import { useCart } from "@/context/CartContext";
import { usePerfil } from "@/context/ProfileContext";
import { randomId } from "@/lib/storage";
import type { DireccionEnvio } from "@/lib/types";
import { formatCOP } from "@/utils/format";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, hydrated, clear } = useCart();
  const { perfil, registrar, crearPedido } = usePerfil();

  const [paso, setPaso] = useState<1 | 2>(1);
  const [modo, setModo] = useState<ModoRegistro>("miembro");
  const [datos, setDatos] = useState<DireccionEnvio>(datosIniciales());
  const [referencia] = useState(() => `RM-${Date.now()}-${randomId("REF")}`);

  const resumen = useMemo(
    () => ({
      piezas: items.reduce((acc, i) => acc + i.cantidad, 0),
      total: subtotal,
    }),
    [items, subtotal]
  );

  const handleSubmitDatos = useCallback(async () => {
    if (modo === "miembro") {
      try {
        await registrar({
          nombre: datos.nombre,
          email: datos.email,
          telefono: datos.telefono,
          miembro: true,
          proveedor: "manual",
        });
      } catch {
        // El perfil requiere contraseña; el usuario puede crearlo en /crear-perfil
      }
    }
    setPaso(2);
  }, [modo, datos, registrar]);

  const handlePagado = useCallback(
    (resultado: ResultadoPago) => {
      const pedido = crearPedido({
        items,
        total: subtotal,
        direccion: datos,
        metodoPago: resultado.metodo,
        referencia: resultado.referencia || referencia,
        esMiembro: modo === "miembro",
      });
      clear();
      router.push(`/mi-perfil?pedido=${pedido.id}`);
    },
    [crearPedido, items, subtotal, datos, modo, referencia, clear, router]
  );

  if (!hydrated) {
    return (
      <>
        <SiteHeader />
        <main className="checkout-page">
          <div className="container checkout-empty">
            <p className="checkout-empty-text">Cargando tu pedido…</p>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (items.length === 0 && paso === 1) {
    return (
      <>
        <SiteHeader />
        <main className="checkout-page">
          <div className="container checkout-empty">
            <h1 className="checkout-title">Tu carrito está vacío</h1>
            <p className="checkout-empty-text">
              Todavía no has elegido ninguna pieza. Vuelve a la Colección Soberbia
              para comenzar tu historia.
            </p>
            <Link href="/coleccion/soberbia" className="cta-btn">
              Descubrir el Brillo de Soberbia
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="checkout-page">
        <div className="container">
          <header className="checkout-header">
            <h1 className="checkout-title">Checkout</h1>
            <ol className="checkout-steps">
              <li className={`checkout-step ${paso === 1 ? "active" : "done"}`}>
                <span className="checkout-step-number">1</span>
                <span className="checkout-step-label">Datos de envío y contacto</span>
              </li>
              <li className={`checkout-step ${paso === 2 ? "active" : ""}`}>
                <span className="checkout-step-number">2</span>
                <span className="checkout-step-label">Pago con Wompi</span>
              </li>
            </ol>
          </header>

          {paso === 1 ? (
            <div className="checkout-grid">
              <div className="checkout-main">
                <CheckoutForm
                  datos={datos}
                  modo={modo}
                  onDatosChange={setDatos}
                  onModoChange={setModo}
                  onSubmit={handleSubmitDatos}
                />
              </div>
              <aside className="checkout-aside">
                <OrderSummary
                  items={items}
                  total={subtotal}
                  piezas={resumen.piezas}
                  perfilEmail={perfil?.email}
                />
              </aside>
            </div>
          ) : (
            <div className="checkout-grid">
              <div className="checkout-main">
                <button
                  type="button"
                  className="checkout-back"
                  onClick={() => setPaso(1)}
                >
                  ← Volver a los datos de envío
                </button>
                <WompiPayment
                  total={subtotal}
                  referencia={referencia}
                  onPagado={handlePagado}
                />
              </div>
              <aside className="checkout-aside">
                <OrderSummary
                  items={items}
                  total={subtotal}
                  piezas={resumen.piezas}
                  perfilEmail={perfil?.email}
                />
                <div className="checkout-direccion">
                  <h3 className="checkout-block-title">Enviar a</h3>
                  <p className="checkout-direccion-text">
                    {datos.nombre}
                    <br />
                    {datos.direccion}, {datos.barrio}
                    <br />
                    {datos.ciudad}, {datos.departamento}
                    <br />
                    {datos.telefono}
                  </p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function OrderSummary({
  items,
  total,
  piezas,
  perfilEmail,
}: {
  items: {
    slug: string;
    nombre: string;
    linea: string;
    precio: number;
    cantidad: number;
    talla: string | null;
    colorHilo: string | null;
    colorHiloHex: string | null;
    observaciones: string;
  }[];
  total: number;
  piezas: number;
  perfilEmail?: string;
}) {
  return (
    <div className="order-summary">
      <h3 className="checkout-block-title">
        Tu pedido {piezas > 0 && `(${piezas})`}
      </h3>
      <ul className="order-summary-items">
        {items.map((item) => (
          <li key={`${item.slug}-${item.talla ?? "s"}-${item.colorHilo ?? "-"}`}>
            <span className="order-summary-name">
              {item.nombre}
              <span className="order-summary-meta">
                {item.linea}
                {item.talla ? ` · Talla ${item.talla}` : ""}
                {item.colorHilo ? ` · Hilo ${item.colorHilo}` : ""}
                {item.observaciones ? ` · ${item.observaciones}` : ""}
              </span>
            </span>
            <span className="order-summary-price">
              {formatCOP(item.precio * item.cantidad)}
            </span>
          </li>
        ))}
      </ul>
      <div className="order-summary-total">
        <span>Subtotal</span>
        <span>{formatCOP(total)}</span>
      </div>
      <p className="order-summary-note">
        Envío seguro a toda Colombia | Incluye Empaque de Lujo y Certificado
      </p>
      {perfilEmail && (
        <p className="order-summary-note order-summary-note--miembro">
          Sesión del Círculo: {perfilEmail}
        </p>
      )}
    </div>
  );
}
