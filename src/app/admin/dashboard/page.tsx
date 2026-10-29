"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function AdminDashboard() {
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
    }
    localStorage.removeItem("admin");
    window.location.href = "/admin/login";
  };

  return (
    <>
      <section className="admin-hero">
        <div className="container">
          <div className="admin-hero-content">
            <div className="admin-hero-brand">
              <div className="admin-isotipo">
                <span aria-hidden="true">✦</span>
              </div>
              <h1 className="admin-title">Romany Melan</h1>
              <p className="admin-subtitle">
                Panel de Gestión de Autor
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="admin-dashboard">
        <div className="container">
          <div className="admin-modules">
            <Link href="/admin/productos" className="admin-module admin-module--productos">
              <div className="admin-module-seal" aria-hidden="true">✦</div>
              <div className="admin-module-body">
                <h2 className="admin-module-title">Gestor de Catálogo / Productos</h2>
                <p className="admin-module-desc">
                  Crear, editar joyas, cargar imágenes y gestionar inventario.
                </p>
              </div>
              <span className="admin-module-arrow">→</span>
            </Link>

            <Link href="/admin/colecciones" className="admin-module admin-module--colecciones">
              <div className="admin-module-seal" aria-hidden="true">✦</div>
              <div className="admin-module-body">
                <h2 className="admin-module-title">Gestor de Colecciones</h2>
                <p className="admin-module-desc">
                  Administrar los 7 Pecados Capitales y crear nuevas colecciones.
                </p>
              </div>
              <span className="admin-module-arrow">→</span>
            </Link>

            <Link href="/admin/pedidos" className="admin-module admin-module--pedidos">
              <div className="admin-module-seal" aria-hidden="true">✦</div>
              <div className="admin-module-body">
                <h2 className="admin-module-title">Gestor de Pedidos &amp; Envíos</h2>
                <p className="admin-module-desc">
                  Seguimiento de compras, estados de tejido y guías de transporte.
                </p>
              </div>
              <span className="admin-module-arrow">→</span>
            </Link>

            <Link href="/admin/clientes" className="admin-module admin-module--clientes">
              <div className="admin-module-seal" aria-hidden="true">✦</div>
              <div className="admin-module-body">
                <h2 className="admin-module-title">CRM de Clientes / Círculo</h2>
                <p className="admin-module-desc">
                  Base de datos de compradores, perfiles creados e historias asignadas.
                </p>
              </div>
              <span className="admin-module-arrow">→</span>
            </Link>
          </div>

          <div className="admin-actions">
            <button
              className="cta-btn admin-logout"
              onClick={logout}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
