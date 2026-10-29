"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

type Coleccion = {
  id: string;
  nombre: string;
  acento_color_hex?: string;
  gema_principal?: string;
  relato_poetico?: string;
  activa?: boolean;
};

export default function AdminColecciones() {
  const [colecciones, setColecciones] = useState<Coleccion[]>([]);
  const [form, setForm] = useState({
    nombre: "",
    acento: "#A882C1",
    gema: "",
    relato: "",
    activa: true,
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("colecciones").select("*").order("nombre");
    setColecciones(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const guardar = async () => {
    const { error } = await supabase.from("colecciones").insert({
      nombre: form.nombre,
      acento_color_hex: form.acento,
      gema_principal: form.gema,
      relato_poetico: form.relato,
      activa: form.activa,
    });
    if (error) { alert("Error: " + error.message); return; }
    setForm({ nombre: "", acento: "#A882C1", gema: "", relato: "", activa: true });
    load();
    alert("Colección guardada");
  };

  return (
    <AdminGuard>
      <main className="admin-productos">
        <div className="container">
          <section className="admin-page-header">
            <div className="admin-page-header-content">
              <div className="admin-page-header-brand">
                <span aria-hidden="true">✦</span>
              </div>
              <div>
                <h1 className="admin-page-title">Gestor de Colecciones</h1>
                <p className="admin-page-subtitle">
                  Administrar los 7 Pecados Capitales y crear nuevas colecciones.
                </p>
              </div>
            </div>
            <Link href="/admin/dashboard" className="cta-btn admin-btn--back">Volver</Link>
          </section>

          <div className="admin-product-table-wrap">
            <table className="admin-product-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Acento</th>
                  <th>Gema</th>
                  <th>Activa</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center" }}>Cargando…</td></tr>
                ) : colecciones.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nombre}</td>
                    <td><span style={{ display: "inline-block", width: 16, height: 16, background: c.acento_color_hex || "#ccc", borderRadius: 4 }} /> {c.acento_color_hex}</td>
                    <td>{c.gema_principal}</td>
                    <td style={{ textAlign: "center" }}>{c.activa !== false ? "Sí" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <section className="admin-product-form">
            <h2 className="admin-form-title">Nueva Colección</h2>
            <div className="admin-form-grid">
              <div className="admin-form-field">
                <label className="admin-form-label">Nombre</label>
                <input className="form-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Acento Hex</label>
                <input className="form-input" value={form.acento} onChange={(e) => setForm({ ...form, acento: e.target.value })} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Gema principal</label>
                <input className="form-input" value={form.gema} onChange={(e) => setForm({ ...form, gema: e.target.value })} />
              </div>
            </div>
            <div className="admin-form-field admin-form-field--full">
              <label className="admin-form-label">Poema / Narrativa</label>
              <textarea className="form-input form-textarea" placeholder="Poema / Narrativa" value={form.relato} onChange={(e) => setForm({ ...form, relato: e.target.value })} />
            </div>
            <div className="admin-form-field admin-form-field--full">
              <label className="admin-form-label checkbox-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} />
                <span>Activa</span>
              </label>
            </div>
            <button className="cta-btn admin-form-save" onClick={guardar} style={{ marginTop: "1rem" }}>Guardar Colección</button>
          </section>
        </div>
      </main>
    </AdminGuard>
  );
}
