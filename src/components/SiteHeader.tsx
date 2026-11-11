"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useCart } from "@/context/CartContext";
import { usePerfil } from "@/context/ProfileContext";

const ENLACES_DESKTOP = [
  { href: "/", label: "Inicio" },
  { href: "/autora", label: "La Autora" },
];

const ENLACES_MOBILE = [
  { href: "/", label: "Inicio" },
  { href: "/autora", label: "La Autora" },
];

const ICON_USER = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const ICON_USER_PLUS = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.2" />
    <path d="M16 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M18 9v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const ICON_HAMBURGER = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const ICON_CLOSE = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { count, open, hydrated } = useCart();
  const { perfil } = usePerfil();
  const pathname = usePathname();
  const router = useRouter();
  const esInicio = pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const renderDesktopLinks = () => (
    <ul className="nav-links">
      {ENLACES_DESKTOP.map((enlace) => (
        <li key={enlace.label} className="nav-item">
          <Link className="nav-link" href={enlace.href}>
            {enlace.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  const renderMobileLinks = (onClose?: () => void) => (
    <ul className="nav-links">
      {ENLACES_MOBILE.map((enlace) => (
        <li key={enlace.label} className="nav-item">
          <Link className="nav-link" href={enlace.href} onClick={onClose}>
            {enlace.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <header className={`header ${scrolled ? "scrolled" : ""}`} id="header">
      <nav className="nav">
        <div className="nav-left">
          {!esInicio && (
            <button
              className="icon-btn nav-back"
              onClick={() => router.back()}
              aria-label="Volver atrás"
              title="Volver atrás"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5L8 12L15 19" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 12H20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <div className="nav-links-desktop">
            {renderDesktopLinks()}
          </div>
          <button
            className="icon-btn nav-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? ICON_CLOSE : ICON_HAMBURGER}
          </button>
        </div>
        <div className="nav-right">
          {perfil ? (
            <Link
              className="icon-btn"
              href="/mi-perfil"
              aria-label="Mi perfil"
              title="Mi Perfil"
            >
              {ICON_USER}
            </Link>
          ) : (
            <>
              <Link
                className="icon-btn"
                href="/inicio-sesion"
                aria-label="Iniciar sesión"
                title="Iniciar sesión"
              >
                {ICON_USER}
              </Link>
              <Link
                className="icon-btn"
                href="/crear-perfil"
                aria-label="Crear perfil"
                title="Crear perfil"
              >
                {ICON_USER_PLUS}
              </Link>
            </>
          )}
          <button
            className="icon-btn cart-btn"
            onClick={open}
            aria-label="Abrir carrito de compras"
            title="Carrito"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 4H5L6.68 14.39C6.77 15.05 7.25 15.57 7.89 15.73L16.16 18.06C16.87 18.26 17.61 17.9 17.89 17.23L20 10H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="21" r="1" fill="currentColor" />
              <circle cx="17" cy="21" r="1" fill="currentColor" />
            </svg>
            {hydrated && count > 0 && (
              <span className="cart-count">{count}</span>
            )}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      <aside
        id="mobile-menu"
        className={`mobile-menu-drawer ${mobileMenuOpen ? "mobile-menu-drawer--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div className="mobile-menu-header">
          <span className="mobile-menu-title">Menú</span>
          <button
            className="icon-btn mobile-menu-close"
            onClick={closeMobileMenu}
            aria-label="Cerrar menú"
          >
            {ICON_CLOSE}
          </button>
        </div>
        <nav className="mobile-menu-nav">
          {renderMobileLinks(closeMobileMenu)}
        </nav>
        <div className="mobile-menu-footer">
          {perfil ? (
            <Link
              className="mobile-menu-profile-link"
              href="/mi-perfil"
              onClick={closeMobileMenu}
            >
              <span>Mi Perfil</span>
              {ICON_USER}
            </Link>
          ) : (
            <div className="mobile-menu-auth-links">
              <Link
                className="mobile-menu-auth-link"
                href="/inicio-sesion"
                onClick={closeMobileMenu}
              >
                {ICON_USER}
                <span>Iniciar sesión</span>
              </Link>
              <Link
                className="mobile-menu-auth-link"
                href="/crear-perfil"
                onClick={closeMobileMenu}
              >
                {ICON_USER_PLUS}
                <span>Crear perfil</span>
              </Link>
            </div>
          )}
        </div>
      </aside>
    </header>
  );
}
