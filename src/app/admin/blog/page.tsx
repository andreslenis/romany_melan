"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import AdminGuard from "@/components/admin/AdminGuard";
import BlogProse from "@/components/blog/BlogProse";
import { supabase } from "@/lib/supabase/client";

interface BlogPostRow {
  id: string;
  slug: string;
  titulo: string;
  resumen: string;
  contenido: string;
  portada: string | null;
  portada_alt: string | null;
  cta_texto: string | null;
  cta_url: string | null;
  categoria: string | null;
  publicado: boolean;
  fecha_publicacion: string;
  updated_at: string | null;
}

type BlogForm = {
  titulo: string;
  slug: string;
  resumen: string;
  contenido: string;
  portada: string;
  portada_alt: string;
  cta_texto: string;
  cta_url: string;
  categoria: string;
  fecha_publicacion: string;
  publicado: boolean;
};

const FORM_VACIO: BlogForm = {
  titulo: "",
  slug: "",
  resumen: "",
  contenido: "",
  portada: "",
  portada_alt: "",
  cta_texto: "",
  cta_url: "",
  categoria: "",
  fecha_publicacion: new Date().toISOString().slice(0, 10),
  publicado: false,
};

function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [form, setForm] = useState<BlogForm>(FORM_VACIO);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("*")
      .order("fecha_publicacion", { ascending: false });
    setPosts((data || []) as BlogPostRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handlePortadaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      setForm((prev) => ({ ...prev, portada: URL.createObjectURL(file) }));
    }
  };

  const uploadPortada = async (): Promise<string | null> => {
    if (!selectedFile) return null;
    setUploading(true);
    try {
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("blog")
        .upload(path, selectedFile);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("blog").getPublicUrl(path);
      return pub.publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const guardar = async () => {
    const titulo = form.titulo.trim();
    const resumen = form.resumen.trim();
    const contenido = form.contenido.trim();
    const slugFinal = form.slug.trim() || slugify(titulo);

    if (!titulo || !resumen || !contenido) {
      alert("Completa título, resumen y contenido.");
      return;
    }
    if (!slugFinal) {
      alert("El slug no puede quedar vacío.");
      return;
    }

    try {
      let portadaFinal = form.portada;
      if (selectedFile) {
        const uploaded = await uploadPortada();
        if (uploaded) portadaFinal = uploaded;
      }

      const payload = {
        slug: slugFinal,
        titulo,
        resumen,
        contenido,
        portada: portadaFinal || null,
        portada_alt: form.portada_alt.trim() || titulo,
        cta_texto: form.cta_texto.trim() || null,
        cta_url: form.cta_url.trim() || null,
        categoria: form.categoria.trim() || null,
        publicado: form.publicado,
        fecha_publicacion: form.fecha_publicacion || new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase
          .from("blog_posts")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("blog_posts").insert(payload);
        if (error) throw error;
      }

      setForm(FORM_VACIO);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setEditingId(null);
      setPreview(false);
      load();
      alert("Entrada guardada");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const duplicado = /duplicate|23505/i.test(message);
      alert(
        duplicado
          ? "Ya existe una entrada con ese slug. Cambia el slug."
          : "Error: " + message
      );
    }
  };

  const editar = (post: BlogPostRow) => {
    setEditingId(post.id);
    setForm({
      titulo: post.titulo,
      slug: post.slug,
      resumen: post.resumen,
      contenido: post.contenido,
      portada: post.portada || "",
      portada_alt: post.portada_alt || "",
      cta_texto: post.cta_texto || "",
      cta_url: post.cta_url || "",
      categoria: post.categoria || "",
      fecha_publicacion: post.fecha_publicacion || new Date().toISOString().slice(0, 10),
      publicado: post.publicado,
    });
    setSelectedFile(null);
    setPreview(false);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta entrada del blog?")) return;
    try {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
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

  const togglePublicado = async (post: BlogPostRow) => {
    try {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          publicado: !post.publicado,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post.id);
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
                <h1 className="admin-page-title">Gestor de Blog</h1>
                <p className="admin-page-subtitle">
                  Crea y edita entradas del blog. El contenido se escribe en
                  Markdown y se puede previsualizar antes de publicar.
                </p>
              </div>
            </div>
            <Link href="/admin/dashboard" className="cta-btn admin-btn--back">
              Volver
            </Link>
          </section>

          <div className="admin-product-table-wrap">
            <table className="admin-product-table">
              <thead>
                <tr>
                  <th>Portada</th>
                  <th>Título</th>
                  <th>Slug</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "2rem", textAlign: "center" }}>
                      Cargando…
                    </td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ padding: "2rem", textAlign: "center", color: "rgba(17,17,17,0.5)" }}
                    >
                      No hay entradas de blog.
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => (
                    <tr key={post.id}>
                      <td>
                        {post.portada ? (
                          <Image
                            src={post.portada}
                            alt=""
                            width={40}
                            height={40}
                            style={{ objectFit: "cover", borderRadius: 4 }}
                          />
                        ) : (
                          <span style={{ color: "rgba(0,0,0,0.35)" }}>—</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 500, maxWidth: 280 }}>
                        {post.titulo}
                      </td>
                      <td style={{ fontSize: "0.85rem", color: "rgba(0,0,0,0.5)" }}>
                        {post.slug}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.15rem 0.5rem",
                            borderRadius: 999,
                            fontSize: "0.75rem",
                            background: post.publicado
                              ? "rgba(168, 130, 193, 0.15)"
                              : "rgba(0,0,0,0.06)",
                            color: post.publicado ? "var(--color-accent)" : "rgba(0,0,0,0.5)",
                          }}
                        >
                          {post.publicado ? "Publicado" : "Borrador"}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                        {post.fecha_publicacion}
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => editar(post)}
                          style={{ marginRight: "0.5rem", color: "var(--color-accent)" }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => togglePublicado(post)}
                          style={{ marginRight: "0.5rem", color: "rgba(0,0,0,0.6)" }}
                        >
                          {post.publicado ? "Despublicar" : "Publicar"}
                        </button>
                        {post.publicado && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            style={{ marginRight: "0.5rem", color: "rgba(0,0,0,0.6)" }}
                          >
                            Ver
                          </Link>
                        )}
                        <button onClick={() => eliminar(post.id)} style={{ color: "#b3261e" }}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <section className="admin-product-form">
            <h2 className="admin-form-title">
              {editingId ? "Editar entrada" : "Nueva entrada"}
            </h2>

            <div className="admin-form-grid">
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Título</label>
                <input
                  className="form-input"
                  placeholder="Título del artículo"
                  value={form.titulo}
                  onChange={(e) => {
                    const titulo = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      titulo,
                      slug: prev.slug || slugify(titulo),
                    }));
                  }}
                />
              </div>

              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Slug (URL del artículo)</label>
                <input
                  className="form-input"
                  placeholder="ej: significado-espiritual-amatista"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
                <p style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.5)", marginTop: "0.25rem" }}>
                  URL resultante: /blog/{form.slug || slugify(form.titulo) || "…"}
                  {editingId && " · cambiar el slug rompe los enlaces anteriores"}
                </p>
              </div>

              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Resumen (meta descripción)</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="Descripción breve que se muestra en el índice y en Google"
                  value={form.resumen}
                  onChange={(e) => setForm({ ...form, resumen: e.target.value })}
                />
              </div>

              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Contenido (Markdown)</label>
                <textarea
                  className="form-input form-textarea"
                  rows={14}
                  placeholder={"## Subtítulo\n\nPárrafo con **negrita** y listas:\n\n- Punto uno\n- Punto dos"}
                  value={form.contenido}
                  onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                />
                <button
                  type="button"
                  className="cta-btn"
                  style={{ marginTop: "0.75rem" }}
                  onClick={() => setPreview((prev) => !prev)}
                >
                  {preview ? "Ocultar vista previa" : "Ver vista previa"}
                </button>
              </div>

              {preview && (
                <div className="admin-form-field admin-form-field--full">
                  <label className="admin-form-label">Vista previa</label>
                  <div
                    style={{
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: "0.75rem",
                      padding: "1.25rem",
                      background: "#fff",
                    }}
                  >
                    {form.contenido.trim() ? (
                      <BlogProse content={form.contenido} fallbackAlt={form.titulo} />
                    ) : (
                      <p style={{ color: "rgba(0,0,0,0.5)" }}>
                        Escribe contenido para ver la vista previa.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Imagen de portada (opcional)</label>
                <input
                  ref={fileInputRef}
                  className="form-input"
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={handlePortadaChange}
                />
                {form.portada && (
                  <div style={{ marginTop: "0.5rem" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.portada}
                      alt="Portada"
                      width={160}
                      height={100}
                      style={{ objectFit: "cover", borderRadius: 4 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                        setForm({ ...form, portada: "" });
                      }}
                      style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#b3261e" }}
                    >
                      Quitar portada
                    </button>
                  </div>
                )}
                <input
                  className="form-input"
                  style={{ marginTop: "0.5rem" }}
                  placeholder="o pega una URL de imagen existente"
                  value={form.portada}
                  onChange={(e) => setForm({ ...form, portada: e.target.value })}
                />
                {uploading && (
                  <p style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.5)", marginTop: "0.25rem" }}>
                    Subiendo portada…
                  </p>
                )}
              </div>

              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Texto alternativo de la portada (SEO)</label>
                <input
                  className="form-input"
                  placeholder="Describe la imagen con palabras clave"
                  value={form.portada_alt}
                  onChange={(e) => setForm({ ...form, portada_alt: e.target.value })}
                />
              </div>

              <div className="admin-form-field">
                <label className="admin-form-label">Texto del botón (CTA)</label>
                <input
                  className="form-input"
                  placeholder="Ver la Colección Soberbia"
                  value={form.cta_texto}
                  onChange={(e) => setForm({ ...form, cta_texto: e.target.value })}
                />
              </div>

              <div className="admin-form-field">
                <label className="admin-form-label">Enlace del botón (CTA)</label>
                <input
                  className="form-input"
                  placeholder="/coleccion/soberbia o https://…"
                  value={form.cta_url}
                  onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
                />
              </div>

              <div className="admin-form-field">
                <label className="admin-form-label">Categoría</label>
                <input
                  className="form-input"
                  placeholder="Mineralogía"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                />
              </div>

              <div className="admin-form-field">
                <label className="admin-form-label">Fecha de publicación</label>
                <input
                  className="form-input"
                  type="date"
                  value={form.fecha_publicacion}
                  onChange={(e) => setForm({ ...form, fecha_publicacion: e.target.value })}
                />
              </div>

              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Estado</label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={form.publicado}
                    onChange={(e) => setForm({ ...form, publicado: e.target.checked })}
                  />
                  <span>Publicado (visible en /blog y en el sitemap)</span>
                </label>
              </div>
            </div>

            <button
              className="cta-btn admin-form-save"
              onClick={guardar}
              style={{ marginTop: "1rem" }}
              disabled={uploading}
            >
              {editingId ? "Actualizar entrada" : "Guardar entrada"}
            </button>
          </section>
        </div>
      </main>
    </AdminGuard>
  );
}