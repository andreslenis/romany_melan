"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import { supabase } from "@/lib/supabase/client";

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
  imagenes?: any;
};

export default function AdminProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ 
    nombre: "", 
    slug: "",
    coleccion: "Soberbia", 
    linea: "origen", 
    precio: 0, 
    stock: 0,
    historia: "",
    descripcion_corta: "",
    activo: true
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('productos').select('*').order('nombre', { ascending: true });
      if (error) {
        console.error('Supabase error:', error.message, error.details);
        alert('Error al cargar productos: ' + error.message);
      } else {
        setProductos(data || []);
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const guardar = async () => {
    try {
      const payload = {
        nombre: form.nombre,
        slug: form.slug || form.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        linea: form.linea === 'singular' ? 'SINGULAR' : 'ORIGEN',
        precio_cop: Number(form.precio) || 0,
        stock_disponible: Number(form.stock) || 0,
        historia_narrativa: form.historia,
        descripcion_corta: form.descripcion_corta,
        activo: form.activo,
        imagenes: []
      };
      if (editingId) {
        const { error } = await supabase.from('productos').update(payload).eq('id', editingId);
        if (error) { alert('Error al actualizar: ' + error.message); return; }
      } else {
        const { error } = await supabase.from('productos').insert(payload);
        if (error) { alert('Error al crear: ' + error.message); return; }
      }
      setForm({ nombre: "", slug: "", coleccion: "Soberbia", linea: "origen", precio: 0, stock: 0, historia: "", descripcion_corta: "", activo: true });
      setEditingId(null);
      load();
      alert('Producto guardado correctamente');
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const editar = (p: Producto) => {
    setEditingId(p.id);
    setForm({
      nombre: p.nombre,
      slug: p.slug || '',
      coleccion: "Soberbia",
      linea: p.linea === 'SINGULAR' ? 'singular' : 'origen',
      precio: p.precio_cop || 0,
      stock: p.stock_disponible || 0,
      historia: p.historia_narrativa || '',
      descripcion_corta: p.descripcion_corta || '',
      activo: p.activo !== false
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (error) { alert('Error al eliminar: ' + error.message); return; }
      load();
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  return (
    <AdminGuard>
      <main className="container" style={{ padding: "2rem 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h1>Gestor de Productos / Inventario</h1>
          <button className="cta-btn" onClick={() => { setEditingId(null); setForm({ nombre: "", slug: "", coleccion: "Soberbia", linea: "origen", precio: 0, stock: 0, historia: "", descripcion_corta: "", activo: true }); }}>+ Nuevo Producto</button>
        </div>
        
        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.75rem", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Nombre</th>
                <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Línea</th>
                <th style={{ padding: "1rem", textAlign: "right", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Precio</th>
                <th style={{ padding: "1rem", textAlign: "center", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Stock</th>
                <th style={{ padding: "1rem", textAlign: "center", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Activo</th>
                <th style={{ padding: "1rem", textAlign: "right", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center" }}>Cargando...</td></tr>
              ) : productos.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 500 }}>{p.nombre}</div>
                    <div style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.5)" }}>{p.slug}</div>
                  </td>
                  <td style={{ padding: "1rem" }}>{p.linea === 'SINGULAR' ? 'Línea Singular' : 'Línea Origen'}</td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>${(p.precio_cop || 0).toLocaleString('es-CO')} COP</td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>{p.stock_disponible || 0}</td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>{p.activo !== false ? "Sí" : "No"}</td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button onClick={() => editar(p)} style={{ marginRight: "0.5rem", color: "var(--color-accent)" }}>Editar</button>
                    <button onClick={() => eliminar(p.id)} style={{ color: "#b3261e" }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: "2rem", background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.75rem", padding: "2rem" }}>
          <h2 style={{ marginBottom: "1.5rem" }}>{editingId ? "Editar Producto" : "Nuevo Producto"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
            <input className="form-input" placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <input className="form-input" placeholder="Slug (opcional)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <select className="form-input" value={form.linea} onChange={(e) => setForm({ ...form, linea: e.target.value })}>
              <option value="origen">Línea Origen</option>
              <option value="singular">Línea Singular</option>
            </select>
            <input className="form-input" type="number" placeholder="Precio COP" value={form.precio} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} />
            <input className="form-input" type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
          </div>
          <textarea className="form-input form-textarea" placeholder="Descripción corta" value={form.descripcion_corta} onChange={(e) => setForm({ ...form, descripcion_corta: e.target.value })} style={{ marginTop: "1rem" }} />
          <textarea className="form-input form-textarea" placeholder="Narrativa / Historia" value={form.historia} onChange={(e) => setForm({ ...form, historia: e.target.value })} style={{ marginTop: "1rem" }} />
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem" }}>
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
            <span>Producto activo</span>
          </label>
          <button className="cta-btn" onClick={guardar} style={{ marginTop: "1.5rem" }}>{editingId ? "Actualizar Producto" : "Guardar Producto"}</button>
        </div>
      </main>
    </AdminGuard>
  );
}
