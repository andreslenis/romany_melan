"use client";

import { useEffect, useState, useRef } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { COLORES_HILO } from "@/lib/pecados";

type Producto = {
  id: string;
  nombre: string;
  slug: string;
  coleccion_id?: string;
  linea?: string;
  precio_cop?: number;
  stock_disponible?: number;
  activo?: boolean;
  descripcion_corta?: string;
  historia_narrativa?: string;
  imagenes?: unknown;
  imagenes_por_color?: unknown;
  imagenesPorColor?: unknown;
  especificaciones?: { material?: string; componentes?: string; piedra?: string };
  tallas?: unknown;
  colores_hilo?: unknown;
};

export default function AdminProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [colecciones, setColecciones] = useState<{ id: string; nombre: string }[]>([]);
  const [coleccionId, setColeccionId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nombre: "",
    slug: "",
    coleccion: "Soberbia",
    grupo: "",
    linea: "origen",
    precio: 0,
    stock: 0,
    historia: "",
    descripcion_corta: "",
    activo: true,
    imagenes: [] as string[],
    tipoHilo: "",
    componentes: "",
    tamanoGema: "",
    requiereTalla: false,
    tallas: "",
    coloresHilo: [] as string[],
    imagenesPorColor: {} as Record<string, string>
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const { data: cols } = await supabase.from("colecciones").select("id,nombre").order("nombre");
    setColecciones(cols || []);
    if (cols && cols.length && !coleccionId) setColeccionId(cols[0].id);
    setLoading(true);
    try {
      const { data, error } = await supabase.from("productos").select("*").order("nombre", { ascending: true });
      if (error) {
        console.error("Supabase error:", error.message, error.details);
        alert("Error al cargar productos: " + error.message);
      } else {
        setProductos(data || []);
      }
    } catch (e) {
      console.error(e);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guardar = async () => {
    try {
      const uploadedUrls: string[] = [];
       const totalAfter = form.imagenes.length + selectedFiles.length;
       if (totalAfter > 3) {
         alert("Máximo 3 fotos por producto");
         return;
       }
       if (form.linea === "origen") {
         const faltantes = form.coloresHilo.filter((c) => !form.imagenesPorColor?.[c]);
         if (faltantes.length > 0) {
           alert("Debes cargar la foto para cada variante de color seleccionada");
           return;
         }
       }
      for (const file of selectedFiles) {
        const path = Date.now() + "-" + Math.random().toString(36).slice(2) + "-" + file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const { error: upErr } = await supabase.storage.from("productos").upload(path, file);
        if (upErr) {
          alert("Error subiendo imagen: " + upErr.message);
          return;
        }
        const { data: pub } = supabase.storage.from("productos").getPublicUrl(path);
        uploadedUrls.push(pub.publicUrl);
      }
      const imagenesPorColorFinal: Record<string, string> = { ...(form.imagenesPorColor || {}) };
      const payload = {
         coleccion_id: coleccionId || null,
         nombre: form.nombre,
          slug: form.slug || form.nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
         linea: form.linea === "singular" ? "SINGULAR" : "ORIGEN",
          grupo: form.grupo || null,
        precio_cop: Number(form.precio) || 0,
        stock_disponible: Number(form.stock) || 0,
        historia_narrativa: form.historia,
        descripcion_corta: form.descripcion_corta,
        activo: form.activo,
         imagenes: [...(form.imagenes || []), ...uploadedUrls].slice(0, 3),
         imagenesPorColor: Object.keys(imagenesPorColorFinal).length > 0 ? imagenesPorColorFinal : null,
        especificaciones: {
          material: form.tipoHilo,
          componentes: form.componentes,
          piedra: form.tamanoGema
        },
        tallas: form.requiereTalla ? form.tallas.split(",").map((t) => t.trim()).filter(Boolean) : [],
         admite_color_hilo: form.linea === "origen",
         colores_hilo: form.linea === "origen" ? form.coloresHilo : []
      };
      if (editingId) {
        const { data, error } = await supabase.from("productos").update(payload).eq("id", editingId).select();
        if (error) {
          alert("Error al actualizar: " + error.message);
          return;
        }
        if (data && data[0]) setProductos((prev) => prev.map((p) => (p.id === editingId ? (data[0] as Producto) : p)));
      } else {
        const { data, error } = await supabase.from("productos").insert(payload).select();
        if (error) {
          alert("Error al crear: " + error.message);
          return;
        }
        if (data && data[0]) setProductos((prev) => [data[0] as Producto, ...prev]);
      }
      setForm({ nombre: "", slug: "", grupo: "", coleccion: "Soberbia", linea: "origen", precio: 0, stock: 0, historia: "", descripcion_corta: "", activo: true, imagenes: [], tipoHilo: "", componentes: "", tamanoGema: "", requiereTalla: false, tallas: "", coloresHilo: [], imagenesPorColor: {} });
      setSelectedFiles([]);
      setEditingId(null);
      load();
      alert("Producto guardado correctamente");
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const editar = (p: Producto) => {
    if (p.coleccion_id) setColeccionId(p.coleccion_id);
    setEditingId(p.id);
    const imgs = Array.isArray(p.imagenes) ? (p.imagenes as string[]) : [];
    const imgsPorColor = (p.imagenesPorColor && typeof p.imagenesPorColor === 'object' ? (p.imagenesPorColor as Record<string, string>) : (p.imagenes_por_color && typeof p.imagenes_por_color === 'object' ? (p.imagenes_por_color as Record<string, string>) : {}));
    setForm({
      nombre: p.nombre,
       slug: p.slug || "",
       grupo: (p as { grupo?: string }).grupo || "",
      coleccion: "Soberbia",
      linea: p.linea === "SINGULAR" ? "singular" : "origen",
      precio: p.precio_cop || 0,
      stock: p.stock_disponible || 0,
      historia: p.historia_narrativa || "",
      descripcion_corta: p.descripcion_corta || "",
      activo: p.activo !== false,
      imagenes: imgs.slice(0, 3),
      tipoHilo: String((p.especificaciones && p.especificaciones.material) || ""),
      componentes: String((p.especificaciones && p.especificaciones.componentes) || ""),
      tamanoGema: String((p.especificaciones && p.especificaciones.piedra) || ""),
      requiereTalla: Array.isArray(p.tallas) && (p.tallas as unknown[]).length > 0,
      tallas: Array.isArray(p.tallas) ? (p.tallas as string[]).join(", ") : "",
      coloresHilo: Array.isArray(p.colores_hilo) ? (p.colores_hilo as string[]) : [],
      imagenesPorColor: imgsPorColor
    });
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    try {
      const { error } = await supabase.from("productos").delete().eq("id", id);
      if (error) {
        alert("Error al eliminar: " + error.message);
        return;
      }
      load();
    } catch (e) {
      alert("Error: " + (e instanceof Error ? e.message : String(e)));
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
                <h1 className="admin-page-title">Gestor de Productos / Inventario</h1>
                <p className="admin-page-subtitle">
                  Crear, editar joyas, cargar imágenes y gestionar inventario de la colección Soberbia.
                </p>
              </div>
            </div>
            <div className="admin-page-header-actions">
              <Link href="/admin/dashboard" className="cta-btn admin-btn--back">Volver</Link>
                <button
                  className="cta-btn admin-btn--new"
                  onClick={() => {
                    setEditingId(null);
                    setForm({ nombre: "", slug: "", grupo: "", coleccion: "Soberbia", linea: "origen", precio: 0, stock: 0, historia: "", descripcion_corta: "", activo: true, imagenes: [], tipoHilo: "", componentes: "", tamanoGema: "", requiereTalla: false, tallas: "", coloresHilo: [], imagenesPorColor: {} });
                    setSelectedFiles([]);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                + Nuevo Producto
              </button>
            </div>
          </section>

          <div className="admin-product-table-wrap">
            <table className="admin-product-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Línea</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Activo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center" }}>Cargando…</td></tr>
                ) : productos.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "rgba(17,17,17,0.5)" }}>No hay productos registrados.</td></tr>
                ) : productos.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.nombre}</div>
                      <div style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.5)" }}>{p.slug}</div>
                    </td>
                    <td>{p.linea === "SINGULAR" ? "Línea Singular" : "Línea Origen"}</td>
                    <td style={{ textAlign: "right" }}>${(p.precio_cop || 0).toLocaleString("es-CO")} COP</td>
                    <td style={{ textAlign: "center" }}>{p.stock_disponible || 0}</td>
                    <td style={{ textAlign: "center" }}>{p.activo !== false ? "Sí" : "No"}</td>
                    <td style={{ textAlign: "right" }}>
                      <button onClick={() => editar(p)} style={{ marginRight: "0.5rem", color: "var(--color-accent)" }}>Editar</button>
                      <button onClick={() => eliminar(p.id)} style={{ color: "#b3261e" }}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <section className="admin-product-form">
            <h2 className="admin-form-title">{editingId ? "Editar Producto" : "Nuevo Producto"}</h2>
            <div className="admin-form-grid">
              <div className="admin-form-field">
                <label className="admin-form-label">Nombre</label>
                <input className="form-input" placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Slug (opcional)</label>
                <input className="form-input" placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Línea</label>
                <select className="form-input" value={form.linea} onChange={(e) => setForm({ ...form, linea: e.target.value })}>
                  <option value="origen">Línea Origen</option>
                  <option value="singular">Línea Singular</option>
                </select>
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Colección (Pecado)</label>
                <select className="form-input" value={coleccionId} onChange={(e) => setColeccionId(e.target.value)}>
                  {colecciones.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Grupo / Familia (para variantes por color)</label>
                <input className="form-input" placeholder="ej. anillo-nudo-sutil" value={form.grupo} onChange={(e) => setForm({ ...form, grupo: e.target.value })} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Precio COP</label>
                <input className="form-input" type="number" placeholder="Precio COP" value={form.precio} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Stock</label>
                <input className="form-input" type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              </div>
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Imágenes (máx. 3)</label>
                {form.imagenes.length > 0 && (
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                    {form.imagenes.map((url, idx) => (
                      <div key={idx} style={{ position: "relative", width: "120px", height: "120px" }}>
                        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px" }} />
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, imagenes: prev.imagenes.filter((_, i) => i !== idx) }))}
                          style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer" }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input ref={fileInputRef} className="form-input" type="file" accept="image/*" multiple disabled={form.imagenes.length >= 3} onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  const available = 3 - form.imagenes.length;
                  setSelectedFiles(files.slice(0, available));
                }} />
                <p style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.5)", marginTop: "0.25rem" }}>{form.imagenes.length} / 3 imágenes</p>
              </div>
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Descripción corta</label>
                <textarea className="form-input form-textarea" placeholder="Descripción corta" value={form.descripcion_corta} onChange={(e) => setForm({ ...form, descripcion_corta: e.target.value })} />
              </div>
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label">Narrativa / Historia</label>
                <textarea className="form-input form-textarea" placeholder="Narrativa" value={form.historia} onChange={(e) => setForm({ ...form, historia: e.target.value })} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Tipo de hilo</label>
                <input className="form-input" value={form.tipoHilo} onChange={(e) => setForm({ ...form, tipoHilo: e.target.value })} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Componentes</label>
                <input className="form-input" value={form.componentes} onChange={(e) => setForm({ ...form, componentes: e.target.value })} />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Tamaño de gema</label>
                <input className="form-input" value={form.tamanoGema} onChange={(e) => setForm({ ...form, tamanoGema: e.target.value })} />
              </div>
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label checkbox-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input type="checkbox" checked={form.requiereTalla} onChange={(e) => setForm({ ...form, requiereTalla: e.target.checked })} />
                  <span>¿Requiere selección de talla?</span>
                </label>
                {form.requiereTalla && (
                  <input className="form-input" placeholder="Tallas separadas por coma (S, M, L)" value={form.tallas} onChange={(e) => setForm({ ...form, tallas: e.target.value })} />
                )}
              </div>
              {form.linea === "origen" && (
                <div className="admin-form-field admin-form-field--full">
                  <label className="admin-form-label">Variantes de color de hilo</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {COLORES_HILO.map((c) => (
                      <label key={c.id} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.6rem", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "4px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={form.coloresHilo.includes(c.id)}
                          onChange={(e) => {
                            setForm((prev) => {
                              const next = e.target.checked
                                ? [...prev.coloresHilo, c.id]
                                : prev.coloresHilo.filter((id) => id !== c.id);
                              const imgs = { ...(prev.imagenesPorColor || {}) };
                              if (!e.target.checked) delete imgs[c.id];
                              return { ...prev, coloresHilo: next, imagenesPorColor: imgs };
                            });
                          }}
                        />
                        <span style={{ width: "14px", height: "14px", borderRadius: "50%", background: c.hex }} />
                        <span style={{ fontSize: "0.85rem" }}>{c.nombre}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {form.linea === "origen" && form.coloresHilo.length > 0 && (
                <div className="admin-form-field admin-form-field--full">
                  <p style={{ marginBottom: "0.75rem", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(17,17,17,0.6)" }}>Imágenes por variante de color</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {form.coloresHilo.map((colorId) => {
                      const color = COLORES_HILO.find((c) => c.id === colorId);
                      return (
                        <div key={colorId} style={{ padding: "0.75rem", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                            <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: color?.hex || "#ccc" }}></span>
                            <span style={{ fontWeight: 500 }}>{color?.nombre || colorId}</span>
                          </div>
                          {form.imagenesPorColor[colorId] && (
                            <div style={{ position: "relative", width: "100px", height: "100px", marginBottom: "0.5rem" }}>
                              <img src={form.imagenesPorColor[colorId]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px" }} />
                              <button
                                type="button"
                                onClick={() => setForm((prev) => {
                                  const next = { ...(prev.imagenesPorColor || {}) };
                                  delete next[colorId];
                                  return { ...prev, imagenesPorColor: next };
                                })}
                                style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: "18px", height: "18px", cursor: "pointer" }}
                              >
                                ×
                              </button>
                            </div>
                          )}
                          <input
                            className="form-input"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              if (!file) return;
                              (async () => {
                                const path = Date.now() + "-" + Math.random().toString(36).slice(2) + "-" + file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
                                const { error: upErr } = await supabase.storage.from("productos").upload(path, file);
                                if (upErr) {
                                  alert("Error subiendo imagen por color: " + upErr.message);
                                  return;
                                }
                                const { data: pub } = supabase.storage.from("productos").getPublicUrl(path);
                                setForm((prev) => ({ ...prev, imagenesPorColor: { ...(prev.imagenesPorColor || {}), [colorId]: pub.publicUrl } }));
                              })();
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="admin-form-field admin-form-field--full">
                <label className="admin-form-label checkbox-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                  <span>Producto activo</span>
                </label>
              </div>
            </div>
            <button className="cta-btn admin-form-save" onClick={guardar} style={{ marginTop: "1rem" }}>
              {editingId ? "Actualizar Producto" : "Guardar Producto"}
            </button>
          </section>
        </div>
      </main>
    </AdminGuard>
  );
}
