"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import CheckoutForm, {
  datosIniciales,
  type ModoRegistro,
} from "@/components/checkout/CheckoutForm";
import WebCheckoutForm from "@/components/checkout/WebCheckoutForm";
import { useCart } from "@/context/CartContext";
import { usePerfil } from "@/context/ProfileContext";
import { randomId } from "@/lib/storage";
import type { DireccionEnvio } from "@/lib/types";
import { formatCOP } from "@/utils/format";

type CodigoDescuentoInfo = {
  valido: boolean;
  descuentoTotal: number;
  items: Array<{
    slug: string;
    precioOriginal: number;
    precioConDescuento: number;
    descuento: number;
    cantidad: number;
  }>;
  totalConDescuento: number;
  error?: string;
};

export default function CheckoutPage() {
  const { items, subtotal, hydrated } = useCart();
  const { perfil, registrar } = usePerfil();

  const [paso, setPaso] = useState<1 | 2>(1);
  const [modo, setModo] = useState<ModoRegistro>("miembro");
  const [datos, setDatos] = useState<DireccionEnvio>(datosIniciales());
  const [referencia] = useState(() => `RM-${Date.now()}-${randomId("REF")}`);
  const [codigoDescuento, setCodigoDescuento] = useState("");
  const [codigoInfo, setCodigoInfo] = useState<CodigoDescuentoInfo | null>(null);
  const [validandoCodigo, setValidandoCodigo] = useState(false);

  // Si hay perfil logueado, forzar modo miembro y pre-llenar datos
  useEffect(() => {
    if (perfil) {
      setModo("miembro");
      setDatos((prev) => ({
        ...prev,
        nombre: perfil.nombre || prev.nombre,
        email: perfil.email || prev.email,
        telefono: perfil.telefono || prev.telefono,
      }));
    }
  }, [perfil]);

  const resumen = useMemo(
    () => ({
      piezas: items.reduce((acc, i) => acc + i.cantidad, 0),
      total: codigoInfo?.totalConDescuento ?? subtotal,
      subtotalOriginal: subtotal,
      descuentoTotal: codigoInfo?.descuentoTotal ?? 0,
    }),
    [items, subtotal, codigoInfo]
  );

  const validarCodigoDescuento = useCallback(async () => {
    const codigo = codigoDescuento.trim().toUpperCase();
    if (!codigo) {
      setCodigoInfo(null);
      return;
    }
    setValidandoCodigo(true);
    try {
      const res = await fetch("/api/checkout/validar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, items }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setCodigoInfo(data);
      } else {
        setCodigoInfo({ valido: false, descuentoTotal: 0, items: [], totalConDescuento: subtotal, error: data.error || "Código no válido" });
      }
    } catch {
      setCodigoInfo({ valido: false, descuentoTotal: 0, items: [], totalConDescuento: subtotal, error: "Error al validar código" });
    } finally {
      setValidandoCodigo(false);
    }
  }, [codigoDescuento, items, subtotal]);

  const handleCodigoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCodigoDescuento(e.target.value);
    if (!e.target.value.trim()) {
      setCodigoInfo(null);
    }
  }, []);

  const handleAplicarCodigo = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    validarCodigoDescuento();
  }, [validarCodigoDescuento]);

  const handleSubmitDatos = useCallback(async () => {
    if (modo === "miembro" && !perfil) {
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
  }, [modo, datos, registrar, perfil]);

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
                  perfil={perfil}
                />
              </div>
              <aside className="checkout-aside">
                <OrderSummary
                  items={items}
                  total={resumen.total}
                  subtotalOriginal={resumen.subtotalOriginal}
                  descuentoTotal={resumen.descuentoTotal}
                  codigoInfo={codigoInfo}
                  codigoDescuento={codigoDescuento}
                  onCodigoChange={handleCodigoChange}
                  onAplicarCodigo={handleAplicarCodigo}
                  validandoCodigo={validandoCodigo}
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
                <WebCheckoutForm
                  total={resumen.total}
                  referencia={referencia}
                  items={items}
                  datos={datos}
                  codigoDescuento={codigoDescuento}
                />
              </div>
              <aside className="checkout-aside">
                <OrderSummary
                  items={items}
                  total={resumen.total}
                  subtotalOriginal={resumen.subtotalOriginal}
                  descuentoTotal={resumen.descuentoTotal}
                  codigoInfo={codigoInfo}
                  codigoDescuento={codigoDescuento}
                  onCodigoChange={handleCodigoChange}
                  onAplicarCodigo={handleAplicarCodigo}
                  validandoCodigo={validandoCodigo}
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
  subtotalOriginal,
  descuentoTotal,
  codigoInfo,
  codigoDescuento,
  onCodigoChange,
  onAplicarCodigo,
  validandoCodigo,
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
  subtotalOriginal: number;
  descuentoTotal: number;
  codigoInfo: CodigoDescuentoInfo | null;
  codigoDescuento: string;
  onCodigoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAplicarCodigo: (e: React.MouseEvent<HTMLButtonElement>) => void;
  validandoCodigo: boolean;
  piezas: number;
  perfilEmail?: string;
}) {
  const tieneDescuento = codigoInfo?.valido === true && descuentoTotal > 0;

  return (
    <div className="order-summary">
      <h3 className="checkout-block-title">
        Tu pedido {piezas > 0 && `(${piezas})`}
      </h3>

      {/* Código de descuento */}
      <div className="checkout-codigo-descuento">
        <label className="form-field" style={{ marginBottom: "0.75rem" }}>
          <span className="form-label">Código de descuento</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              className="form-input"
              type="text"
              value={codigoDescuento}
              onChange={onCodigoChange}
              placeholder="Ingresa tu código"
              style={{ flex: 1, textTransform: "uppercase" }}
              disabled={validandoCodigo || tieneDescuento}
            />
            <button
              type="button"
              className="cta-btn"
              onClick={onAplicarCodigo}
              disabled={validandoCodigo || !codigoDescuento.trim() || tieneDescuento}
              style={{ whiteSpace: "nowrap" }}
            >
              {validandoCodigo ? "Validando…" : tieneDescuento ? "Aplicado" : "Aplicar"}
            </button>
          </div>
          {codigoInfo?.error && (
            <p className="form-error" style={{ color: "#b3261e", fontSize: "0.8rem", marginTop: "0.35rem" }}>
              {codigoInfo.error}
            </p>
          )}
          {tieneDescuento && (
            <p className="form-success" style={{ color: "#2d7a2d", fontSize: "0.8rem", marginTop: "0.35rem" }}>
              ¡Código aplicado! Descuento del 5% en cada producto.
            </p>
          )}
        </label>
      </div>

      <ul className="order-summary-items">
        {items.map((item) => {
          const itemCodigoInfo = codigoInfo?.items.find((ci) => ci.slug === item.slug);
          const tieneDescuentoItem = itemCodigoInfo && itemCodigoInfo.descuento > 0;
          const precioUnitario = tieneDescuentoItem ? itemCodigoInfo.precioConDescuento : item.precio;
          const precioOriginalUnitario = tieneDescuentoItem ? itemCodigoInfo.precioOriginal : item.precio;
          const subtotalItem = precioUnitario * item.cantidad;

          return (
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
                {tieneDescuentoItem && (
                  <>
                    <span style={{ textDecoration: "line-through", color: "rgba(17,17,17,0.45)", fontSize: "0.85em", marginRight: "0.5rem" }}>
                      {formatCOP(precioOriginalUnitario * item.cantidad)}
                    </span>
                    <span style={{ color: "#2d7a2d", fontWeight: 600 }}>
                      {formatCOP(subtotalItem)}
                    </span>
                    <span style={{ color: "#2d7a2d", fontSize: "0.75em", marginLeft: "0.35rem" }}>
                      (-{formatCOP(itemCodigoInfo.descuento * item.cantidad)})
                    </span>
                  </>
                )}
                {!tieneDescuentoItem && formatCOP(subtotalItem)}
              </span>
            </li>
          );
        })}
      </ul>

      {tieneDescuento && (
        <div className="order-summary-discount">
          <div className="order-summary-row">
            <span>Subtotal</span>
            <span>{formatCOP(subtotalOriginal)}</span>
          </div>
          <div className="order-summary-row" style={{ color: "#2d7a2d" }}>
            <span>Descuento (5%)</span>
            <span>-{formatCOP(descuentoTotal)}</span>
          </div>
          <div className="order-summary-total">
            <span>Total a pagar</span>
            <span>{formatCOP(total)}</span>
          </div>
        </div>
      )}

      {!tieneDescuento && (
        <div className="order-summary-total">
          <span>Subtotal</span>
          <span>{formatCOP(total)}</span>
        </div>
      )}

      <p className="order-summary-note">
        Envío gratis a toda Colombia | Incluye Empaque y Certificado de piezas
      </p>
      <p className="order-summary-note">
        Pieza de fabricación artesanal: tiempo de producción de 3 a 5 días
        hábiles antes del envío. La guía de envío se comparte por el correo y
        número de teléfono otorgado.
      </p>
      {perfilEmail && (
        <p className="order-summary-note order-summary-note--miembro">
          Sesión del Círculo: {perfilEmail}
        </p>
      )}
    </div>
  );
}