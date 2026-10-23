"use client";

import { useState } from "react";

type Pedido = { id: string; cliente: string; fecha: string; total: number; pago: string; envio: string; hilo: string; guia: string };

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([
    { id: "#RM-1001", cliente: "Ana Pérez", fecha: "2026-10-20", total: 107000, pago: "Pagado", envio: "En preparación", hilo: "Lila", guia: "" },
  ]);
  const [guia, setGuia] = useState("");
  const [seleccionado, setSeleccionado] = useState<Pedido | null>(null);

  const actualizar = (estado: string) => {
    if (!seleccionado) return;
    setPedidos((ps) => ps.map((p) => (p.id === seleccionado.id ? { ...p, envio: estado, guia: guia || p.guia } : p)));
  };

  return (
    <main className="container">
      <h1>Admin Pedidos</h1>
      <div style={{ display: "flex", gap: "1rem", margin: "1rem 0" }}>
        <div className="trust-item">Ventas Totales: ${pedidos.reduce((a, p) => a + p.total, 0).toLocaleString()}</div>
        <div className="trust-item">Por preparar: {pedidos.filter((p) => p.envio === "En preparación").length}</div>
        <div className="trust-item">Enviados: {pedidos.filter((p) => p.envio === "Enviado").length}</div>
      </div>
      <table style={{ width: "100%" }}>
        <thead><tr><th>ID</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Pago</th><th>Envío</th></tr></thead>
        <tbody>
          {pedidos.map((p) => (
            <tr key={p.id} onClick={() => setSeleccionado(p)} style={{ cursor: "pointer" }}>
              <td>{p.id}</td><td>{p.cliente}</td><td>{p.fecha}</td><td>{p.total}</td><td>{p.pago}</td><td>{p.envio}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {seleccionado && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Detalle {seleccionado.id}</h2>
          <p>Color de hilo: {seleccionado.hilo}</p>
          <p>Datos de despacho del cliente</p>
          <select onChange={(e) => actualizar(e.target.value)} defaultValue={seleccionado.envio}>
            <option>En preparación</option>
            <option>Enviado</option>
          </select>
          <input className="form-input" placeholder="Guía de rastreo" value={guia} onChange={(e) => setGuia(e.target.value)} />
          <button className="cta-btn" onClick={() => actualizar(seleccionado.envio)}>Notificar Cliente</button>
        </div>
      )}
    </main>
  );
}
