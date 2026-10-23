"use client";

import { useState } from "react";

type Producto = { id: number; nombre: string; coleccion: string; linea: string; precio: number; stock: number; activo: boolean };

export default function AdminProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [form, setForm] = useState({ nombre: "", coleccion: "Soberbia", linea: "origen", precio: 0, historia: "" });

  const guardar = () => {
    setProductos((p) => [...p, { id: Date.now(), nombre: form.nombre, coleccion: form.coleccion, linea: form.linea, precio: form.precio, stock: 1, activo: true }]);
    setForm({ nombre: "", coleccion: "Soberbia", linea: "origen", precio: 0, historia: "" });
  };

  return (
    <main className="container">
      <h1>Admin Productos</h1>
      <button className="cta-btn" onClick={() => {}}>+ Nuevo Producto</button>
      <table style={{ width: "100%", marginTop: "1rem" }}>
        <thead>
          <tr><th>Nombre</th><th>Colección</th><th>Línea</th><th>Precio</th><th>Stock</th><th>Activo</th></tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id}><td>{p.nombre}</td><td>{p.coleccion}</td><td>{p.linea}</td><td>{p.precio}</td><td>{p.stock}</td><td>{p.activo ? "Sí" : "No"}</td></tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: "2rem" }}>
        <input className="form-input" placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <select value={form.coleccion} onChange={(e) => setForm({ ...form, coleccion: e.target.value })}><option>Soberbia</option><option>Ira</option></select>
        <select value={form.linea} onChange={(e) => setForm({ ...form, linea: e.target.value })}><option value="origen">Línea Origen</option><option value="singular">Línea Singular</option></select>
        <input className="form-input" type="number" placeholder="Precio" value={form.precio} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} />
        <textarea className="form-input form-textarea" placeholder="Historia" value={form.historia} onChange={(e) => setForm({ ...form, historia: e.target.value })} />
        <button className="cta-btn" onClick={guardar}>Guardar Joya en Catálogo</button>
      </div>
    </main>
  );
}
