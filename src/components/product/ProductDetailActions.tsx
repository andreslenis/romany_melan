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
    <div className="space-y-6 pt-4 border-t border-gray-200">
      
      {/* Precio con formato limpio */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-serif font-medium text-[#1A1918]">
          {formatCOP(price)}
        </span>
        <span className="text-xs text-[#8C7A5B] uppercase tracking-wider font-semibold bg-[#FAF9F6] px-2.5 py-1 border border-[#E5E0D8]">
          Envío Gratis Incluido
        </span>
      </div>

      {/* Botones de Acción (Comprar Web + WhatsApp de Cierre) */}
      <div className="space-y-3">
        <button
          onClick={onAddToCart}
          className="w-full py-4 bg-[#1A1918] text-white hover:bg-[#33312F] transition-colors text-sm font-medium tracking-widest uppercase shadow-sm"
        >
          Comprar Ahora (Wompi)
        </button>

        <button
          onClick={handleWhatsAppClick}
          className="w-full py-3.5 bg-[#25D366] text-white hover:bg-[#22bf5b] transition-colors text-sm font-medium tracking-wide flex items-center justify-center gap-2 shadow-sm"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          Dudas o asesoría con la diseñadora por WhatsApp
        </button>
      </div>

      {/* Badges de Confianza bajo el botón */}
      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100 text-center">
        <div className="p-2 bg-[#FAF9F6] border border-[#E5E0D8] rounded-sm">
          <p className="text-[10px] uppercase font-semibold text-[#1A1918]">🔒 Pago Seguro</p>
          <p className="text-[10px] text-[#6B6560]">Wompi Colombia</p>
        </div>
        <div className="p-2 bg-[#FAF9F6] border border-[#E5E0D8] rounded-sm">
          <p className="text-[10px] uppercase font-semibold text-[#1A1918]">📦 Envío Gratis</p>
          <p className="text-[10px] text-[#6B6560]">A todo el país</p>
        </div>
        <div className="p-2 bg-[#FAF9F6] border border-[#E5E0D8] rounded-sm">
          <p className="text-[10px] uppercase font-semibold text-[#1A1918]">✨ Oro Laminado</p>
          <p className="text-[10px] text-[#6B6560]">Garantizado</p>
        </div>
      </div>

    </div>
  );
}