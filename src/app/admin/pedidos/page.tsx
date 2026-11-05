"use client";

import { useCallback, useEffect, useState } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

type Pedido = {
  id: string;
  numero_pedido?: string;
  cliente_nombre?: string;
  cliente_email?: string;
  cliente_telefono?: string;
  items?: unknown[];
  total_cop?: number;
  estado_pago?: string;
  wompi_status?: string;
  wompi_transaction_id?: string;
  estado_envio?: string;
  guia_rastreo?: string;
  transportadora?: string;
  created_at?: string;
};

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [selected, setSelected] = useState<Pedido | null>(null);
  const [transportadora, setTransportadora] = useState("");
  const [guia, setGuia] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/admin/pedidos", { headers, cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        pedidos?: Pedido[];
        error?: string;
        detail?: string;
      };
      if (!res.ok || !json.ok) {
        throw new Error(json.detail || json.error || `http_${res.status}`);
      }
      setPedidos(json.pedidos || []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudieron cargar los pedidos.";
      setError(msg);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const actualizarEstado = async (id: string, estado_envio: string) => {
    setError(null);
    const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
    const res = await fetch("/api/admin/pedidos", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id, estado_envio }),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; detail?: string };
    if (!res.ok || !json.ok) {
      setError(json.detail || json.error || "No se pudo actualizar el estado.");
      return;
    }
    load();
  };

  const guardarDespacho = async () => {
    if (!selected) return;
    setError(null);
    const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
    const res = await fetch("/api/admin/pedidos", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id: selected.id, transportadora, guia_rastreo: guia }),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; detail?: string };
    if (!res.ok || !json.ok) {
      setError(json.detail || json.error || "No se pudo guardar el despacho.");
      return;
    }
    setSelected(null);
    load();
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

          {error && (
            <p style={{ color: "#b00020", marginBottom: "1rem" }} role="alert">
              {error}
            </p>
          )}

          <div className="admin-product-table-wrap">
            <table className="admin-product-table">
              <thead>
                <tr>
                  <th># Pedido</th>
                  <th>Cliente</th>
                  <th>Pago</th>
                  <th>Wompi</th>
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
                    <td title={p.wompi_transaction_id || ""} style={{ fontSize: "0.85em" }}>{p.wompi_status || p.wompi_transaction_id?.slice(0, 10) || "—"}</td>
                    <td>
                      <select value={p.estado_envio || "EN_PREPARACION"} onChange={(e) => actualizarEstado(p.id, e.target.value)} className="form-input">
                        <option value="EN_PREPARACION">En preparación</option>
                        <option value="ENVIADO">Enviado</option>
                        <option value="ENTREGADO">Entregado</option>
                      </select>
                    </td>
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
