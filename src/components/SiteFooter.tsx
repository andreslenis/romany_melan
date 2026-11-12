"use client";

import { useState } from "react";

export default function SiteFooter() {
  const [trustOpen, setTrustOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);

  return (
    <footer className="footer">
      <div className="container footer-top">
        <p className="footer-poem">
          Cada pieza nace del diálogo entre la materia, la emoción y la memoria.
          Minerales, gemas y nudos hechos a mano se entrelazan para dar forma a
          historias vivas que se adhieren a la piel.
        </p>
        <ul className="footer-links">
          <li>
            <button className="footer-link" onClick={() => setPoliciesOpen(true)}>
              Políticas
            </button>
          </li>
          <li>
            <button className="footer-link" onClick={() => setTrustOpen(true)}>
              Confianza y Garantía
            </button>
          </li>
          <li>
            <button className="footer-link" onClick={() => setContactOpen(true)}>
              Contacto
            </button>
          </li>
          <li>
            <a className="footer-link" href="/mi-perfil">
              Círculo Romany Melan
            </a>
          </li>
        </ul>
        <div className="socials">
          <a
            className="social-link social-link--instagram"
            href="https://www.instagram.com/romanymelan?cplk=eGwzaGluNWg4amRs&utm_source=qr"
            aria-label="Instagram"
            target="_blank"
            rel="noreferrer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17" cy="7" r="1" />
            </svg>
          </a>
          <a
            className="social-link social-link--whatsapp"
            href="https://wa.me/message/MPA2IBBSX32DM1"
            aria-label="WhatsApp"
            target="_blank"
            rel="noreferrer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.5 3.5A14 14 0 0 1 21 12c0 4.7-2.8 8.8-6.9 10.4-.5.2-1 .1-1.3-.3a12 12 0 0 1-22-13.7c.2-.5.7-1 1.2-1.3A14 14 0 0 1 17.5 3.5z" />
              <path d="M12 9v4l2.5 2" />
            </svg>
          </a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Romany Melan. Todos los derechos reservados.</span>
        <a href="/admin/login" className="footer-admin-link" style={{ opacity: 0.6, color: "#777" }}>
          • Admin
        </a>
      </div>

      {trustOpen && (
        <div
          onClick={() => setTrustOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", padding: "2rem", borderRadius: "8px", maxWidth: "520px", width: "90%" }}>
            <h3>Confianza y Garantía</h3>
            <div className="trust-bar-grid">
              <div className="trust-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L15 8H22L16 12L18 19L12 15L6 19L8 12L2 8H9L12 2Z" stroke="currentColor" strokeWidth="1.2" /></svg>
                <span className="trust-title">Alta Artesanía Garantizada</span>
                <p>Cada pieza es elaborada a mano con Oro Laminado 18K / Oro Macizo 18K y gemas naturales.</p>
              </div>
              <div className="trust-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 7H21L19 19H5L3 7Z" stroke="currentColor" strokeWidth="1.2" /><path d="M9 7V5C9 3.9 9.9 3 11 3H13C14.1 3 15 3.9 15 5V7" stroke="currentColor" strokeWidth="1.2" /></svg>
                <span className="trust-title">Envío Seguro a Colombia</span>
                <p>Despachos asegurados con guía de rastreo a todo el país.</p>
              </div>
              <div className="trust-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" /><path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="1.2" /></svg>
                <span className="trust-title">Certificado de Autenticidad</span>
                <p>Incluye relato impreso, certificado de garantía y estuche protector de lujo.</p>
              </div>
              <div className="trust-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 4H20V20H4V4Z" stroke="currentColor" strokeWidth="1.2" /><path d="M8 12H16" stroke="currentColor" strokeWidth="1.2" /></svg>
                <span className="trust-title">Atención Personalizada</span>
                <p>
                  <a href="https://wa.me/573000000000" target="_blank" rel="noreferrer">
                    ¿Tienes dudas sobre la medida o la pieza? Habla directamente con el taller.
                  </a>
                </p>
              </div>
            </div>
            <button className="cta-btn" onClick={() => setTrustOpen(false)} style={{ marginTop: "1rem" }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {contactOpen && (
        <div
          onClick={() => setContactOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", padding: "2rem", borderRadius: "8px", maxWidth: "520px", width: "90%" }}>
            <h3>Contacto</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                <div>
                  <p style={{ fontWeight: 600 }}>Correo electrónico</p>
                  <a href="mailto:romanymelanstudio@gmail.com" style={{ color: "inherit" }}>romanymelanstudio@gmail.com</a>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                <div>
                  <p style={{ fontWeight: 600 }}>WhatsApp</p>
                  <a href="https://wa.me/573122608873" target="_blank" rel="noreferrer" style={{ color: "inherit" }}>+57 312 260 8873</a>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" /><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" /><circle cx="17" cy="7" r="1" fill="currentColor" /></svg>
                <div>
                  <p style={{ fontWeight: 600 }}>Instagram</p>
                  <a href="https://www.instagram.com/romanymelan?cplk=eGwzaGluNWg4amRs&utm_source=qr" target="_blank" rel="noreferrer" style={{ color: "inherit" }}>@romanymelan</a>
                </div>
              </div>
            </div>
            <button className="cta-btn" onClick={() => setContactOpen(false)} style={{ marginTop: "1rem" }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {policiesOpen && (
        <div
          onClick={() => setPoliciesOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", padding: "2rem", borderRadius: "8px", maxWidth: "600px", width: "90%", maxHeight: "80vh", overflowY: "auto" }}>
            <h3>Políticas</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <details style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px", padding: "1rem" }}>
                <summary style={{ fontWeight: 600, cursor: "pointer", fontSize: "1rem" }}>Políticas de envío</summary>
                <div style={{ marginTop: "1rem", lineHeight: 1.7, color: "#333" }}>
                  <p><strong>Tiempos de preparación:</strong> Al ser piezas de alta joyería artesanal elaboradas a mano (micro-macramé, engaste de gemas y acabados en oro laminado), cada pedido requiere un tiempo de taller de 2 a 5 días hábiles antes de ser despachado.</p>
                  <p><strong>Tiempos de entrega:</strong> Una vez despachado, los tiempos de envío varían según la ciudad de destino (generalmente entre 2 y 5 días hábiles a nivel nacional).</p>
                  <p><strong>Costos de envío:</strong> Se calcula dentro del precio del producto, no cobramos otro valor diferente a este. Ofrecemos envíos seguros para garantizar que cada pieza llegue en perfectas condiciones.</p>
                </div>
              </details>
              <details style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px", padding: "1rem" }}>
                <summary style={{ fontWeight: 600, cursor: "pointer", fontSize: "1rem" }}>Cambios y Garantías</summary>
                <div style={{ marginTop: "1rem", lineHeight: 1.7, color: "#333" }}>
                  <p><strong>Garantía por calidad:</strong> Todas nuestras piezas cuentan con garantía de 30 días por defectos de fabricación en el tejido de micro-macramé, cierres o componentes metálicos (oro laminado 18K y acero inoxidable).</p>
                  <p><strong>Condiciones de cambio:</strong> Debido a la naturaleza artesanal e íntima de las joyas, aceptamos solicitudes de cambio por defectos de fábrica o inconformidad en el modelo dentro de los 5 días hábiles posteriores a la recepción del pedido. La pieza debe conservar su empaque original y no presentar signos de uso indebido.</p>
                  <p><strong>Exclusiones:</strong> No aplican cambios por desgaste natural debido al uso inadecuado, exposición a químicos abrasivos, perfumes o humedad excesiva.</p>
                </div>
              </details>
              <details style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: "8px", padding: "1rem" }}>
                <summary style={{ fontWeight: 600, cursor: "pointer", fontSize: "1rem" }}>Tratamiento de Datos</summary>
                <div style={{ marginTop: "1rem", lineHeight: 1.7, color: "#333" }}>
                  <p><strong>Protección de información:</strong> En Romany Melan respetamos tu privacidad. Los datos personales que compartes al registrarte (nombre, correo, dirección y teléfono) son utilizados exclusivamente para procesar tus pedidos, gestionar envíos y brindarte una atención personalizada a través de nuestros canales oficiales (WhatsApp Business y correo).</p>
                  <p><strong>Confidencialidad:</strong> Tus datos nunca serán compartidos, vendidos o cedidos a terceros con fines comerciales ajenos a la marca. Tienes el derecho de solicitar la actualización o eliminación de tus datos en cualquier momento escribiéndonos a nuestro soporte.</p>
                </div>
              </details>
            </div>
            <button className="cta-btn" onClick={() => setPoliciesOpen(false)} style={{ marginTop: "1rem" }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}