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

  const load = async () => {
    const { data } = await supabase.from("colecciones").select("*").order("nombre");
    setColecciones(data || []);
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
      <main className="container" style={{ padding: "2rem 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h1>Gestor de Colecciones</h1>
          <Link href="/admin/dashboard" className="cta-btn">Volver</Link>
        </div>
        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.75rem", overflow: "hidden", marginBottom: "2rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                <th style={{ padding: "1rem", textAlign: "left" }}>Nombre</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>Acento</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>Gema</th>
                <th style={{ padding: "1rem", textAlign: "center" }}>Activa</th>
              </tr>
            </thead>
            <tbody>
              {colecciones.map((c) => (
                <tr key={c.id} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  <td style={{ padding: "1rem" }}>{c.nombre}</td>
                  <td style={{ padding: "1rem" }}><span style={{ display: "inline-block", width: 16, height: 16, background: c.acento_color_hex || "#ccc", borderRadius: 4 }} /> {c.acento_color_hex}</td>
                  <td style={{ padding: "1rem" }}>{c.gema_principal}</td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>{c.activa !== false ? "Sí" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.75rem", padding: "2rem" }}>
          <h2>Nueva Colección</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: "1rem", marginTop: "1rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}><span>Nombre</span><input className="form-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}><span>Acento Hex</span><input className="form-input" value={form.acento} onChange={(e) => setForm({ ...form, acento: e.target.value })} /></label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}><span>Gema principal</span><input className="form-input" value={form.gema} onChange={(e) => setForm({ ...form, gema: e.target.value })} /></label>
          </div>
          <textarea className="form-input form-textarea" placeholder="Poema / Narrativa" value={form.relato} onChange={(e) => setForm({ ...form, relato: e.target.value })} style={{ marginTop: "1rem" }} />
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem" }}>
            <input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} />
            <span>Activa</span>
          </label>
          <button className="cta-btn" onClick={guardar} style={{ marginTop: "1.5rem" }}>Guardar Colección</button>
        </div>
      </main>
    </AdminGuard>
  );
}
