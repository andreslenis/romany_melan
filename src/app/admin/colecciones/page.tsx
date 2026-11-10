"use client";

import { useEffect, useState, useRef } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import type { Coleccion, ModoColeccion } from "@/lib/types";

const MODO_OPTIONS: { value: ModoColeccion; label: string }[] = [
  { value: "activa", label: "Activa (disponible en inicio y ruta)" },
  { value: "proximamente", label: "Proximamente (visible, lista de espera)" },
  { value: "inactiva", label: "Inactiva (oculta en inicio)" },
];

type ColeccionForm = {
  nombre: string;
  slug: string;
  descripcion: string;
  foto_url: string;
  texto_boton: string;
  descripcion_larga: string;
  lema: string;
  acento_color_hex: string;
  modo_acceso: ModoColeccion;
};

export default function AdminColecciones() {
  const [colecciones, setColecciones] = useState<Coleccion[]>([]);
  const [form, setForm] = useState<ColeccionForm>({
    nombre: "",
    slug: "",
    descripcion: "",
    foto_url: "",
    texto_boton: "Ingresar a la Colección",
    descripcion_larga: "",
    lema: "",
    acento_color_hex: "#A882C1",
    modo_acceso: "activa",
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    const { data } = await supabase.from("colecciones").select("*").order("nombre");
    setColecciones((data || []) as Coleccion[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const slugFromName = (nombre: string) =>
    nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setForm((prev) => ({ ...prev, foto_url: url }));
    }
  };

  const uploadFoto = async (): Promise<string | null> => {
    if (!selectedFile) return null;
    setUploading(true);
    try {
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("colecciones").upload(path, selectedFile);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("colecciones").getPublicUrl(path);
      return pub.publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const guardar = async () => {
    let fotoFinal = form.foto_url;
    if (selectedFile) {
      const uploaded = await uploadFoto();
      if (uploaded) fotoFinal = uploaded;
    }

    const payload = {
      nombre: form.nombre,
      slug: form.slug || slugFromName(form.nombre),
      descripcion: form.descripcion,
      foto_url: fotoFinal,
      texto_boton: form.texto_boton,
      descripcion_larga: form.descripcion_larga,
      lema: form.lema,
      acento_color_hex: form.acento_color_hex,
      modo_acceso: form.modo_acceso,
      activa: form.modo_acceso === "activa",
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("colecciones").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("colecciones").insert(payload);
        if (error) throw error;
      }
      setForm({
        nombre: "", slug: "", descripcion: "", foto_url: "", texto_boton: "Ingresar a la Colección",
        descripcion_larga: "", lema: "", acento_color_hex: "#A882C1", modo_acceso: "activa",
      });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setEditingId(null);
      URL.revokeObjectURL(fotoFinal);
      load();
      alert("Colección guardada");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      alert("Error: " + message);
    }
  };

  const editar = (c: Coleccion) => {
    setEditingId(c.id);
    setForm({
      nombre: c.nombre,
      slug: c.slug || "",
      descripcion: c.descripcion || "",
      foto_url: c.foto_url || "",
      texto_boton: c.texto_boton || "Ingresar a la Colección",
      descripcion_larga: c.descripcion_larga || "",
      lema: c.lema || "",
      acento_color_hex: c.acento_color_hex || "#A882C1",
      modo_acceso: c.modo_acceso || "activa",
    });
    setSelectedFile(null);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta colección?")) return;
    try {
      const { error } = await supabase.from("colecciones").delete().eq("id", id);
      if (error) throw error;
      load();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      alert("Error: " + message);
    }
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
                  Crea y administra colecciones. Cada una tiene su propia ruta, color y modo de acceso.
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
                  <th>Slug</th>
                  <th>Color</th>
                  <th>Modo</th>
                  <th>Foto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center" }}>Cargando…</td></tr>
                ) : colecciones.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "rgba(17,17,17,0.5)" }}>No hay colecciones registradas.</td></tr>
                ) : colecciones.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.nombre}</td>
                    <td style={{ fontSize: "0.85rem", color: "rgba(0,0,0,0.5)" }}>{c.slug}</td>
                    <td>
                      <span style={{ display: "inline-block", width: 16, height: 16, background: c.acento_color_hex || "#ccc", borderRadius: 4, marginRight: "0.5rem" }} />
                      {c.acento_color_hex || "—"}
                    </td>
                    <td style={{ textAlign: "center" }}>{c.modo_acceso || "activa"}</td>
                    <td>
                      {c.foto_url ? (
                        <img src={c.foto_url} alt="" className="admin-coleccion-foto" />
                      ) : (
                        <span className="admin-coleccion-sinfoto">-</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button onClick={() => editar(c)} style={{ marginRight: "0.5rem", color: "var(--color-accent)" }}>Editar</button>
                      <button onClick={() => eliminar(c.id)} style={{ color: "#b3261e" }}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <section className="admin-product-form">
            <h2 className="admin-form-title">{editingId ? "Editar Colección" : "Nueva Colección"}</h2>
            <div className="admin-form-grid">
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Nombre</label>
                <input className="form-input" placeholder="Nombre de la colección" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Slug (URL de la colección)</label>
                <input className="form-input" placeholder="ej: coleccion-verano" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                <p style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.5)", marginTop: "0.25rem" }}>{form.slug || slugFromName(form.nombre)}</p>
              </div>
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Foto de la colección (card-media)</label>
                <input ref={fileInputRef} className="form-input" type="file" accept="image/*" disabled={uploading} onChange={handleFotoChange} />
                {form.foto_url && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <img src={form.foto_url} alt="preview" style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 4 }} />
                    {selectedFile && <button type="button" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; setForm({ ...form, foto_url: "" }); }} style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#b3261e" }}>Quitar foto</button>}
                  </div>
                )}
                {uploading && <p style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.5)", marginTop: "0.25rem" }}>Subiendo foto…</p>}
              </div>
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Descripción corta</label>
                <textarea className="form-input form-textarea" placeholder="Descripción corta para la card" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Lema de la colección</label>
                <input className="form-input" placeholder="Lema" value={form.lema} onChange={(e) => setForm({ ...form, lema: e.target.value })} />
              </div>
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Texto del botón de entrada (card)</label>
                <input className="form-input" placeholder="Ingresar a la Colección" value={form.texto_boton} onChange={(e) => setForm({ ...form, texto_boton: e.target.value })} />
              </div>
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Descripción larga (ruta de la colección)</label>
                <textarea className="form-input form-textarea" placeholder="Descripción larga que se muestra en la ruta de la colección" value={form.descripcion_larga} onChange={(e) => setForm({ ...form, descripcion_larga: e.target.value })} />
              </div>
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Color en hexadecimal</label>
                <input className="form-input" type="color" value={form.acento_color_hex} onChange={(e) => setForm({ ...form, acento_color_hex: e.target.value })} />
                <input className="form-input" style={{ marginTop: "0.5rem" }} placeholder="#A882C1" value={form.acento_color_hex} onChange={(e) => setForm({ ...form, acento_color_hex: e.target.value })} />
              </div>
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Modo de acceso</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {MODO_OPTIONS.map((o) => (
                    <label key={o.value} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input type="radio" checked={form.modo_acceso === o.value} onChange={() => setForm({ ...form, modo_acceso: o.value })} />
                      <span>{o.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button className="cta-btn admin-form-save" onClick={guardar} style={{ marginTop: "1rem" }} disabled={uploading}>
              {editingId ? "Actualizar Colección" : "Guardar Colección"}
            </button>
          </section>
        </div>
      </main>
    </AdminGuard>
  );
}
