"use client";

import Link from "next/link";
import { useState } from "react";

export default function SiteFooter() {
  const [open, setOpen] = useState(false);
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
            <Link className="footer-link" href="/#policies">
              Políticas
            </Link>
          </li>
          <li>
            <button className="footer-link" onClick={() => setOpen(true)}>
              Confianza y Garantía
            </button>
          </li>
          <li>
            <Link className="footer-link" href="/#contacto">
              Contacto
            </Link>
          </li>
          <li>
            <Link className="footer-link" href="/mi-perfil">
              Círculo Romany Melan
            </Link>
          </li>
        </ul>
        <div className="socials">
          <a className="social-link" href="#" aria-label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="17" cy="7" r="1" fill="currentColor" />
            </svg>
          </a>
          <a className="social-link" href="#" aria-label="Pinterest">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" />
              <path d="M12 7C9.5 7 8 8.5 8 10.5C8 11.5 8.5 12.5 9.5 13C9.25 13.75 9 14.5 8.75 15.25C8.75 15.5 8.75 15.75 9 15.75C9.25 15.75 9.5 15.5 9.75 15.25C10.25 14.5 10.75 13.75 11 13C11.33 13.05 11.66 13.08 12 13.08C14.5 13.08 16 11.58 16 9.58C16 8.08 14.5 7 12 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Romany Melan. Todos los derechos reservados.</span>
        <Link href="/admin/login" className="footer-admin-link" style={{ opacity: 0.6, color: "#777" }}>
          • Admin
        </Link>
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
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
            <button className="cta-btn" onClick={() => setOpen(false)} style={{ marginTop: "1rem" }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
