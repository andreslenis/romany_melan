"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

type Pedido = {
  id: string;
  numero_pedido?: string;
  cliente_nombre?: string;
  cliente_email?: string;
  items?: unknown[];
  total_cop?: number;
  estado_pago?: string;
  estado_envio?: string;
  guia_rastreo?: string;
  transportadora?: string;
  created_at?: string;
};

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [selected, setSelected] = useState<Pedido | null>(null);
  const [transportadora, setTransportadora] = useState("");
  const [guia, setGuia] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("pedidos").select("*").order("created_at", { ascending: false });
    setPedidos(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const actualizarEstado = async (id: string, estado_envio: string) => {
    await supabase.from("pedidos").update({ estado_envio }).eq("id", id);
    load();
  };

  const guardarDespacho = async () => {
    if (!selected) return;
    await supabase.from("pedidos").update({ transportadora, guia_rastreo: guia }).eq("id", selected.id);
    setSelected(null);
    load();
    alert("Despacho guardado");
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
                <h1 className="admin-page-title">Gestor de Pedidos / Taller</h1>
                <p className="admin-page-subtitle">
                  Seguimiento de compras, estados de tejido y guías de transporte.
                </p>
              </div>
            </div>
            <Link href="/admin/dashboard" className="cta-btn admin-btn--back">Volver</Link>
          </section>

          <div className="admin-product-table-wrap">
            <table className="admin-product-table">
              <thead>
                <tr>
                  <th># Pedido</th>
                  <th>Cliente</th>
                  <th>Pago</th>
                  <th>Tejido</th>
                  <th>Envío</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center" }}>Cargando…</td></tr>
                ) : pedidos.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "rgba(17,17,17,0.5)" }}>No hay pedidos registrados.</td></tr>
                ) : pedidos.map((p) => (
                  <tr key={p.id}>
                    <td>{p.numero_pedido || p.id.slice(0, 8)}</td>
                    <td>{p.cliente_nombre}</td>
                    <td>{p.estado_pago || "PENDIENTE"}</td>
                    <td>
                      <select value={p.estado_envio || "Por Tejer"} onChange={(e) => actualizarEstado(p.id, e.target.value)} className="form-input">
                        <option>Por Tejer</option>
                        <option>En Proceso</option>
                        <option>Listo para Despacho</option>
                      </select>
                    </td>
                    <td>{p.estado_envio || "Pendiente"}</td>
                    <td style={{ textAlign: "right" }}>${(p.total_cop || 0).toLocaleString("es-CO")}</td>
                    <td style={{ textAlign: "right" }}>
                      <button onClick={() => { setSelected(p); setTransportadora(p.transportadora || ""); setGuia(p.guia_rastreo || ""); }} style={{ color: "var(--color-accent)" }}>Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setSelected(null)}>
              <div style={{ background: "#fff", borderRadius: "0.75rem", padding: "2rem", maxWidth: "640px", width: "90%", maxHeight: "80vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
                <h2>Pedido {selected.numero_pedido || selected.id.slice(0, 8)}</h2>
                <p style={{ color: "rgba(0,0,0,0.6)" }}>{selected.cliente_nombre} · {selected.cliente_email}</p>
                <h3 style={{ marginTop: "1rem" }}>Ficha de confección</h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {(selected.items || []).map((it, idx) => (
                    <li key={idx} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", padding: "0.75rem 0" }}>
                      <div style={{ fontWeight: 600 }}>{String((it as Record<string, unknown>).nombre)}</div>
                      <div>Línea: {String((it as Record<string, unknown>).linea)}</div>
                      <div style={{ fontWeight: 700 }}>Color de hilo: {String((it as Record<string, unknown>).colorHilo || (it as Record<string, unknown>).colorHiloHex || "-")}</div>
                      <div>Talla: {String((it as Record<string, unknown>).talla || "-")}</div>
                      {((it as Record<string, unknown>).observaciones ? <div>Nota: {String((it as Record<string, unknown>).observaciones)}</div> : null)}
                    </li>
                  ))}
                </ul>
                <h3 style={{ marginTop: "1rem" }}>Despacho</h3>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <span>Transportadora</span>
                  <input className="form-input" value={transportadora} onChange={(e) => setTransportadora(e.target.value)} placeholder="Servientrega, Interrapidísimo..." />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "0.5rem" }}>
                  <span>Número de guía</span>
                  <input className="form-input" value={guia} onChange={(e) => setGuia(e.target.value)} placeholder="Guía de rastreo" />
                </label>
                <button className="cta-btn" onClick={guardarDespacho} style={{ marginTop: "1rem" }}>{guia ? "Actualizar" : "Guardar Despacho"}</button>
                {guia && (
                  <a
                    href={"https://wa.me/?text=" + encodeURIComponent("Tu pedido " + (selected.numero_pedido || selected.id) + " fue enviado por " + transportadora + ". Guía: " + guia)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cta-btn"
                    style={{ marginLeft: "0.5rem", marginTop: "1rem", display: "inline-block" }}
                  >
                    Notificar Guía al Cliente
                  </a>
                )}
                <button className="cta-btn" style={{ marginLeft: "0.5rem", marginTop: "1rem" }} onClick={() => setSelected(null)}>Cerrar</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </AdminGuard>
  );
}
