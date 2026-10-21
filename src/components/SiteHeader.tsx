"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useCart } from "@/context/CartContext";
import { usePerfil } from "@/context/ProfileContext";

const ENLACES = [
  { href: "/", label: "Inicio" },
  {
    label: "Colección 7 Pecados",
    submenu: [
      { href: "/coleccion/soberbia", label: "Soberbia" },
      { href: "/#coleccion", label: "Ira (Próximamente)", disabled: true },
      { href: "/#coleccion", label: "Gula (Próximamente)", disabled: true },
      { href: "/#coleccion", label: "Envidia (Próximamente)", disabled: true },
      { href: "/#coleccion", label: "Lujuria (Próximamente)", disabled: true },
      { href: "/#coleccion", label: "Pereza (Próximamente)", disabled: true },
      { href: "/#coleccion", label: "Avaricia (Próximamente)", disabled: true },
    ],
  },
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

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const { count, open, hydrated } = useCart();
  const { perfil } = usePerfil();
  const pathname = usePathname();
  const router = useRouter();
  const esInicio = pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        submenuOpen &&
        !document.querySelector(".nav-submenu-wrap")?.contains(target)
      ) {
        setSubmenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [submenuOpen]);

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
          <ul className="nav-links">
            {ENLACES.map((enlace) => (
              <li key={enlace.label} className={enlace.submenu ? "nav-item nav-item--has-submenu" : "nav-item"}>
                {enlace.submenu ? (
                  <div className="nav-submenu-wrap">
                    <button
                      className="nav-link nav-link--btn"
                      aria-haspopup="true"
                      aria-expanded={submenuOpen}
                      onClick={() => setSubmenuOpen((prev) => !prev)}
                    >
                      {enlace.label}
                    </button>
                    <ul className={`nav-submenu ${submenuOpen ? "nav-submenu--open" : ""}`}>
                      {enlace.submenu.map((sub) => (
                        <li key={sub.label}>
                          {sub.disabled ? (
                            <span className="nav-submenu-item nav-submenu-item--disabled">{sub.label}</span>
                          ) : (
                            <Link
                              className="nav-submenu-item"
                              href={sub.href}
                              onClick={() => setSubmenuOpen(false)}
                            >
                              {sub.label}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <Link className="nav-link" href={enlace.href}>
                    {enlace.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
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
            className="icon-btn"
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
    </header>
  );
}
