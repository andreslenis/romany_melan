"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";

import { useCart } from "@/context/CartContext";
import { colorPorId } from "@/lib/pecados";
import { formatCOP } from "@/utils/format";

export default function CartDrawer() {
  const {
    items,
    count,
    subtotal,
    isOpen,
    close,
    updateQuantity,
    removeItem,
    cambiosPrecio,
    descartarCambiosPrecio,
    syncPrices,
    codigoDescuento,
    codigoInfo,
    setCodigoDescuento,
    setCodigoInfo,
  } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Close mobile menu when cart opens
    const event = new CustomEvent("romany:close-mobile-menu");
    window.dispatchEvent(event);

    void syncPrices();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, close, syncPrices]);

  return (
    <div className={`cart-drawer-root ${isOpen ? "is-open" : ""}`}>
      <div
        className="cart-overlay"
        onClick={close}
        aria-hidden="true"
      />
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        ref={panelRef}
        tabIndex={-1}
      >
        <header className="cart-drawer-header">
          <div>
            <h2 className="cart-drawer-title">Tu Carrito</h2>
            <p className="cart-drawer-subtitle">
              {count === 0
                ? "Aún no hay piezas en tu historia."
                : `${count} ${count === 1 ? "pieza" : "piezas"} seleccionada${count === 1 ? "" : "s"}`}
            </p>
            <p className="cart-drawer-subtitle">
              Estás a un paso de llevar una historia hecha a mano.
            </p>

          </div>
          <button className="cart-drawer-close" onClick={close} aria-label="Cerrar carrito">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="cart-drawer-body">
          {cambiosPrecio.length > 0 && (
            <div className="cart-price-notice" role="status">
              <p className="cart-price-notice-title">Precio actualizado</p>
              <ul>
                {cambiosPrecio.map((cambio) => (
                  <li key={cambio.slug}>
                    {cambio.nombre}: <s>{formatCOP(cambio.antes)}</s> →{" "}
                    <strong>{formatCOP(cambio.ahora)}</strong>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="cart-price-notice-close"
                onClick={descartarCambiosPrecio}
              >
                Entendido
              </button>
            </div>
          )}
          {items.length === 0 ? (
            <div className="cart-empty">
              <p className="cart-empty-text">
                Tu carrito está vacío. Descubre las piezas de la Colección Soberbia
                y empieza a tejer tu historia.
              </p>
              <Link
                href="/coleccion/soberbia"
                className="cta-btn"
                onClick={close}
              >
                Descubrir el Brillo de Soberbia
              </Link>
            </div>
          ) : (
            <>
              {/* Código de descuento en carrito */}
              <div className="cart-codigo-descuento">
                <label className="form-field" style={{ marginBottom: "0.75rem" }}>
                  <span className="form-label">Código de descuento</span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      className="form-input"
                      type="text"
                      value={codigoDescuento}
                      onChange={(e) => setCodigoDescuento(e.target.value.toUpperCase())}
                      placeholder="Ingresa tu código"
                      style={{ flex: 1, textTransform: "uppercase" }}
                      disabled={codigoInfo?.valido === true}
                    />
                    <button
                      type="button"
                      className="cta-btn"
                      onClick={async () => {
                        const codigo = codigoDescuento.trim().toUpperCase();
                        if (!codigo) return;
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
                        }
                      }}
                      disabled={!codigoDescuento.trim() || codigoInfo?.valido === true}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {codigoInfo?.valido === true ? "Aplicado" : "Aplicar"}
                    </button>
                  </div>
                  {codigoInfo?.error && (
                    <p className="form-error" style={{ color: "#b3261e", fontSize: "0.8rem", marginTop: "0.35rem" }}>
                      {codigoInfo.error}
                    </p>
                  )}
                  {codigoInfo?.valido === true && (
                    <p className="form-success" style={{ color: "#2d7a2d", fontSize: "0.8rem", marginTop: "0.35rem" }}>
                      ¡Código aplicado! Descuento del 5% en cada producto.
                    </p>
                  )}
                </label>
              </div>
              <ul className="cart-items">
              {items.map((item) => {
                const color = colorPorId(item.colorHilo);
                return (
                  <li
                    className="cart-item"
                    key={`${item.slug}-${item.talla ?? "s"}-${item.colorHilo ?? "-"}`}
                  >
                    <div className="cart-item-media">
                      <Image
                        src={item.imagen}
                        alt={item.nombre}
                        fill
                        sizes="96px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div className="cart-item-info">
                      {item.coleccion && (
                        <p className="cart-item-coleccion">{item.coleccion}</p>
                      )}
                      <p className="cart-item-name">{item.nombre}</p>
                      <p className="cart-item-line">{item.linea}</p>
                      {item.colorHiloHex && (
                        <p className="cart-item-color">
                          <span
                            className="color-swatch color-swatch--static"
                            style={{ backgroundColor: item.colorHiloHex }}
                            aria-hidden="true"
                          />
                          {color
                            ? `Hilo ${color.nombre} · ${color.pecado}`
                            : `Hilo ${item.colorHilo}`}
                        </p>
                      )}
                      {item.talla && (
                        <p className="cart-item-talla">Talla {item.talla}</p>
                      )}
                      {item.observaciones && (
                        <p className="cart-item-notes">“{item.observaciones}”</p>
                      )}
                      <div className="cart-item-controls">
                        <div className="qty-control">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.slug,
                                item.talla,
                                item.colorHilo,
                                item.cantidad - 1
                              )
                            }
                            aria-label="Restar una unidad"
                          >
                            −
                          </button>
                          <span>{item.cantidad}</span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.slug,
                                item.talla,
                                item.colorHilo,
                                item.cantidad + 1
                              )
                            }
                            aria-label="Sumar una unidad"
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="cart-item-remove"
                          onClick={() =>
                            removeItem(item.slug, item.talla, item.colorHilo)
                          }
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                    <div className="cart-item-price">
                      <span className="cart-item-unit">{formatCOP(item.precio)}</span>
                      <span className="cart-item-total">
                        {formatCOP(item.precio * item.cantidad)}
                      </span>
                    </div>
                  </li>
                );
              })}
</ul>
              </>
            )}
          </div>

        {items.length > 0 && (
          <footer className="cart-drawer-footer">
            <div className="cart-subtotal">
              <span>Subtotal</span>
              <span className="cart-subtotal-value">{formatCOP(subtotal)}</span>
            </div>
            {codigoInfo?.valido === true && (
              <div className="cart-discount" style={{ color: "#2d7a2d", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                <span>Descuento (5%)</span>
                <span style={{ marginLeft: "auto" }}>-{formatCOP(codigoInfo.descuentoTotal)}</span>
              </div>
            )}
            {codigoInfo?.valido === true && (
              <div className="cart-total" style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                <span>Total a pagar</span>
                <span style={{ marginLeft: "auto" }}>{formatCOP(codigoInfo.totalConDescuento)}</span>
              </div>
            )}
            <p className="cart-note">
              Envío seguro a toda Colombia | Incluye Empaque de Lujo y Certificado
            </p>
            <Link
              href="/checkout"
              className="pdp-add-btn cart-checkout-btn"
              onClick={close}
            >
              Proceder al Pago
            </Link>
          </footer>
        )}
      </aside>
    </div>
  );
}
