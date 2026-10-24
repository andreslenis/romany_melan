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

  const load = async () => {
    const { data } = await supabase.from("pedidos").select("*").order("created_at", { ascending: false });
    setPedidos(data || []);
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
      <main className="container" style={{ padding: "2rem 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h1>Gestor de Pedidos / Taller</h1>
          <Link href="/admin/dashboard" className="cta-btn">Volver</Link>
        </div>
        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.75rem", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                <th style={{ padding: "1rem", textAlign: "left" }}># Pedido</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>Cliente</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>Pago</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>Tejido</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>Envío</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Total</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  <td style={{ padding: "1rem" }}>{p.numero_pedido || p.id.slice(0, 8)}</td>
                  <td style={{ padding: "1rem" }}>{p.cliente_nombre}</td>
                  <td style={{ padding: "1rem" }}>{p.estado_pago || "PENDIENTE"}</td>
                  <td style={{ padding: "1rem" }}>
                    <select value={p.estado_envio || "Por Tejer"} onChange={(e) => actualizarEstado(p.id, e.target.value)}>
                      <option>Por Tejer</option>
                      <option>En Proceso</option>
                      <option>Listo para Despacho</option>
                    </select>
                  </td>
                  <td style={{ padding: "1rem" }}>{p.estado_envio || "Pendiente"}</td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>${(p.total_cop || 0).toLocaleString("es-CO")}</td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
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
              <button className="cta-btn" onClick={guardarDespacho} style={{ marginTop: "1rem" }}>Guardar Despacho</button>
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
      </main>
    </AdminGuard>
  );
}
