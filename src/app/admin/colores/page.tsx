"use client";

import { useEffect, useState, useRef } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

type ColorForm = {
  slug: string;
  nombre: string;
  hex: string;
  foto_url: string;
  foto_alt: string;
  activo: boolean;
  orden: number;
};

type ColorRow = {
  id: string;
  slug: string;
  nombre: string;
  hex: string;
  foto_url: string | null;
  foto_alt: string | null;
  activo: boolean;
  orden: number;
};

const FORM_VACIO: ColorForm = {
  slug: "",
  nombre: "",
  hex: "#A882C1",
  foto_url: "",
  foto_alt: "",
  activo: true,
  orden: 0,
};

function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminColores() {
  const [colores, setColores] = useState<ColorRow[]>([]);
  const [form, setForm] = useState<ColorForm>(FORM_VACIO);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("colores_hilo")
      .select("*")
      .order("orden", { ascending: true })
      .order("nombre");
    setColores((data || []) as ColorRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      setForm((prev) => ({ ...prev, foto_url: URL.createObjectURL(file) }));
    }
  };

  const uploadFoto = async (): Promise<string | null> => {
    if (!selectedFile) return null;
    setUploading(true);
    try {
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("colores").upload(path, selectedFile);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("colores").getPublicUrl(path);
      return pub.publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const guardar = async () => {
    const nombre = form.nombre.trim();
    const hex = form.hex.trim();
    const slugFinal = form.slug.trim() || slugify(nombre);

    if (!nombre || !hex) {
      alert("Completa nombre y color hexadecimal.");
      return;
    }
    if (!slugFinal) {
      alert("El slug no puede quedar vacío.");
      return;
    }

    try {
      let fotoFinal = form.foto_url;
      if (selectedFile) {
        const uploaded = await uploadFoto();
        if (uploaded) fotoFinal = uploaded;
      }

      const payload = {
        slug: slugFinal,
        nombre,
        hex,
        foto_url: fotoFinal || null,
        foto_alt: form.foto_alt.trim() || nombre,
        activo: form.activo,
        orden: Number(form.orden) || 0,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase.from("colores_hilo").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("colores_hilo").insert(payload);
        if (error) throw error;
      }

      setForm(FORM_VACIO);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setEditingId(null);
      load();
      alert("Color guardado");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const duplicado = /duplicate|23505/i.test(message);
      alert(duplicado ? "Ya existe un color con ese slug." : "Error: " + message);
    }
  };

  const editar = (c: ColorRow) => {
    setEditingId(c.id);
    setForm({
      slug: c.slug,
      nombre: c.nombre,
      hex: c.hex,
      foto_url: c.foto_url || "",
      foto_alt: c.foto_alt || "",
      activo: c.activo,
      orden: c.orden,
    });
    setSelectedFile(null);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este color del catálogo?")) return;
    try {
      const { error } = await supabase.from("colores_hilo").delete().eq("id", id);
      if (error) throw error;
      if (editingId === id) {
        setEditingId(null);
        setForm(FORM_VACIO);
      }
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
                <h1 className="admin-page-title">Gestor de Colores de Hilo</h1>
                <p className="admin-page-subtitle">
                  Crea y edita los colores disponibles para las variantes de hilo de cada pieza.
                </p>
              </div>
            </div>
            <Link href="/admin/dashboard" className="cta-btn admin-btn--back">Volver</Link>
          </section>

          <div className="admin-product-table-wrap">
            <table className="admin-product-table">
              <thead>
                <tr>
                  <th>Color</th>
                  <th>Nombre</th>
                  <th>Slug</th>
                  <th>Orden</th>
                  <th>Activo</th>
                  <th>Foto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center" }}>Cargando…</td></tr>
                ) : colores.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "rgba(17,17,17,0.5)" }}>No hay colores registrados.</td></tr>
                ) : colores.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ display: "inline-block", width: 16, height: 16, background: c.hex, borderRadius: 4, marginRight: "0.5rem", verticalAlign: "middle" }} />
                      {c.hex}
                    </td>
                    <td style={{ fontWeight: 500 }}>{c.nombre}</td>
                    <td style={{ fontSize: "0.85rem", color: "rgba(0,0,0,0.5)" }}>{c.slug}</td>
                    <td style={{ textAlign: "center" }}>{c.orden}</td>
                    <td style={{ textAlign: "center" }}>{c.activo ? "Sí" : "No"}</td>
                    <td>
                      {c.foto_url ? (
                        <img src={c.foto_url} alt="" style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4 }} />
                      ) : (
                        <span style={{ color: "rgba(0,0,0,0.35)" }}>—</span>
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
            <h2 className="admin-form-title">{editingId ? "Editar Color" : "Nuevo Color"}</h2>
            <div className="admin-form-grid">
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Nombre del color</label>
                <input
                  className="form-input"
                  placeholder="ej: Amatista"
                  value={form.nombre}
                  onChange={(e) => {
                    const nombre = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      nombre,
                      slug: prev.slug || slugify(nombre),
                    }));
                  }}
                />
              </div>
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Slug (identificador único)</label>
                <input className="form-input" placeholder="ej: amatista" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                <p style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.5)", marginTop: "0.25rem" }}>
                  Se usa para asignar el color a los productos. No lo cambies si ya está en uso.
                </p>
              </div>
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Color hexadecimal</label>
                <input className="form-input" type="color" value={form.hex} onChange={(e) => setForm({ ...form, hex: e.target.value })} />
                <input className="form-input" style={{ marginTop: "0.5rem" }} placeholder="#A882C1" value={form.hex} onChange={(e) => setForm({ ...form, hex: e.target.value })} />
              </div>
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Foto del color (opcional, para el catálogo)</label>
                <input ref={fileInputRef} className="form-input" type="file" accept="image/*" disabled={uploading} onChange={handleFotoChange} />
                {form.foto_url && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <img src={form.foto_url} alt="preview" style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 4 }} />
                    {selectedFile && (
                      <button type="button" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; setForm({ ...form, foto_url: "" }); }} style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#b3261e" }}>
                        Quitar foto
                      </button>
                    )}
                  </div>
                )}
                <input className="form-input" style={{ marginTop: "0.5rem" }} placeholder="o pega una URL de imagen existente" value={form.foto_url} onChange={(e) => setForm({ ...form, foto_url: e.target.value })} />
                {uploading && <p style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.5)", marginTop: "0.25rem" }}>Subiendo foto…</p>}
              </div>
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Texto alternativo de la foto (SEO)</label>
                <input className="form-input" placeholder="Describe la imagen" value={form.foto_alt} onChange={(e) => setForm({ ...form, foto_alt: e.target.value })} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Orden</label>
                <input className="form-input" type="number" min={0} value={form.orden} onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })} />
              </div>
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Estado</label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                  <span>Activo (disponible para asignar a productos)</span>
                </label>
              </div>
            </div>
            <button className="cta-btn admin-form-save" onClick={guardar} style={{ marginTop: "1rem" }} disabled={uploading}>
              {editingId ? "Actualizar Color" : "Guardar Color"}
            </button>
          </section>
        </div>
      </main>
    </AdminGuard>
  );
}