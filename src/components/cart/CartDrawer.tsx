"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";

import { useCart } from "@/context/CartContext";
import { colorPorId } from "@/lib/pecados";
import { formatCOP } from "@/utils/format";

export default function CartDrawer() {
  const { items, count, subtotal, isOpen, close, updateQuantity, removeItem } =
    useCart();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, close]);

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
          )}
        </div>

        {items.length > 0 && (
          <footer className="cart-drawer-footer">
            <div className="cart-subtotal">
              <span>Subtotal</span>
              <span className="cart-subtotal-value">{formatCOP(subtotal)}</span>
            </div>
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
