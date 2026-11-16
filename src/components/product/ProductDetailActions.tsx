"use client";

import { formatCOP } from "@/utils/format";

interface ProductDetailActionsProps {
  price: number;
  whatsappMessage: string;
  onAddToCart: () => void;
}

export default function ProductDetailActions({
  price,
  whatsappMessage,
  onAddToCart,
}: ProductDetailActionsProps) {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "573000000000";

  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, "_blank");
  };

  return (
    <div className="product-detail-actions">
      {/* Precio con formato limpio */}
      <div className="product-detail-price">
        <span className="product-detail-price-current">
          {formatCOP(price)}
        </span>
        <span className="product-detail-price-badge">
          Envío Gratis Incluido
        </span>
      </div>

      {/* Botones de Acción (Comprar Web + WhatsApp de Cierre) */}
      <div className="product-detail-buttons">
        <button
          onClick={onAddToCart}
          className="product-detail-btn product-detail-btn--primary"
        >
          Comprar Ahora (Wompi)
        </button>

        <button
          onClick={handleWhatsAppClick}
          className="product-detail-btn product-detail-btn--whatsapp"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.5 3.5A14 14 0 0 1 21 12c0 4.7-2.8 8.8-6.9 10.4-.5.2-1 .1-1.3-.3a12 12 0 0 1-22-13.7c.2-.5.7-1 1.2-1.3A14 14 0 0 1 17.5 3.5z" />
            <path d="M12 9v4l2.5 2" fill="white" />
          </svg>
          Dudas o asesoría con la diseñadora por WhatsApp
        </button>
      </div>

      {/* Badges de Confianza bajo el botón */}
      <div className="product-detail-trust">
        <div className="product-detail-trust-item">
          <p className="product-detail-trust-title">🔒 Pago Seguro</p>
          <p className="product-detail-trust-desc">Wompi Colombia</p>
        </div>
        <div className="product-detail-trust-item">
          <p className="product-detail-trust-title">📦 Envío Gratis</p>
          <p className="product-detail-trust-desc">A todo el país</p>
        </div>
        <div className="product-detail-trust-item">
          <p className="product-detail-trust-title">✨ Oro Laminado</p>
          <p className="product-detail-trust-desc">Garantizado</p>
        </div>
      </div>
    </div>
  );
}