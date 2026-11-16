"use client";

export default function WhatsAppFloatButton() {
  const whatsappNumber = "573122608873";
  const defaultMessage = "Hola, vi sus joyas en la web y quiero asesoría";
  const href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float-btn"
      aria-label="Contactar por WhatsApp"
      title="Contactar por WhatsApp"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
        <path d="M17.5 3.5A14 14 0 0 1 21 12c0 4.7-2.8 8.8-6.9 10.4-.5.2-1 .1-1.3-.3a12 12 0 0 1-22-13.7c.2-.5.7-1 1.2-1.3A14 14 0 0 1 17.5 3.5z" />
        <path d="M12 9v4l2.5 2" fill="white" />
      </svg>
      <span className="whatsapp-pulse" aria-hidden="true"></span>
    </a>
  );
}