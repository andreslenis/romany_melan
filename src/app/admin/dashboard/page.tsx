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
    window.location.href="/admin/login";
  };

  return (
    <main className="container">
      <h1>Panel de Gestión de Autor</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1rem", marginTop: "1rem" }}>
        <Link href="/admin/productos" className="trust-item"><strong>Gestor de Catálogo / Productos</strong><p>Crear, editar joyas, cargar imágenes y gestionar inventario.</p></Link>
        <Link href="/admin/colecciones" className="trust-item"><strong>Gestor de Colecciones</strong><p>Administrar los 7 Pecados Capitales y crear nuevas colecciones.</p></Link>
        <Link href="/admin/pedidos" className="trust-item"><strong>Gestor de Pedidos & Envíos</strong><p>Seguimiento de compras, estados de tejido y guías de transporte.</p></Link>
        <Link href="/admin/clientes" className="trust-item"><strong>CRM de Clientes / Círculo</strong><p>Base de datos de compradores, perfiles creados e historias asignadas.</p></Link>
      </div>
      <button className="cta-btn" onClick={logout} style={{ marginTop:"1rem" }}>Cerrar Sesión</button>
    </main>
  );
}
