"use client";

import { useCallback, useEffect, useState } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

type DireccionEnvio = {
  nombre?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  barrio?: string;
  ciudad?: string;
  departamento?: string;
  codigoPostal?: string;
  notas?: string;
};

type Pedido = {
  id: string;
  numero_pedido?: string;
  cliente_nombre?: string;
  cliente_email?: string;
  cliente_telefono?: string;
  direccion_envio?: DireccionEnvio | null;
  items?: unknown[];
  total_cop?: number;
  estado_pago?: string;
  wompi_status?: string;
  wompi_transaction_id?: string;
  estado_envio?: string;
  guia_rastreo?: string;
  transportadora?: string;
  post_pago_procesado_at?: string | null;
  created_at?: string;
};

const CLASE_ESTADO: Record<string, string> = {
  EN_PREPARACION: "estado-envio--preparacion",
  ENVIADO: "estado-envio--enviado",
  ENTREGADO: "estado-envio--entregado",
  CANCELADO: "estado-envio--cancelado",
};

const ETIQUETA: React.CSSProperties = {
  color: "rgba(0,0,0,0.55)",
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

function texto(valor: unknown): string {
  return String(valor ?? "").trim();
}

function bloqueNota(titulo: string, valor: unknown) {
  const contenido = texto(valor);
  return (
    <div style={{ marginTop: "0.35rem" }}>
      <span style={ETIQUETA}>{titulo}</span>
      <p
        style={{
          margin: "0.15rem 0 0",
          whiteSpace: "pre-wrap",
          fontStyle: contenido ? "italic" : "normal",
          color: contenido ? "inherit" : "rgba(0,0,0,0.45)",
        }}
      >
        {contenido ? `“${contenido}”` : "Sin observaciones"}
      </p>
    </div>
  );
}

function estadoFallback(estado?: string): string {
  return estado && CLASE_ESTADO[estado] ? estado : "EN_PREPARACION";
}

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
  const [eliminando, setEliminando] = useState<string | null>(null);

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

  const eliminarPedido = async (p: Pedido) => {
    const confirmar = window.confirm(
      `¿Eliminar el pedido ${p.numero_pedido || p.id.slice(0, 8)}? Esta acción devuelve el stock y no se puede deshacer.`
    );
    if (!confirmar) return;

    setError(null);
    setEliminando(p.id);
    try {
      const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
      const res = await fetch("/api/admin/pedidos", {
        method: "DELETE",
        headers,
        body: JSON.stringify({ id: p.id }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; detail?: string };
      if (!res.ok || !json.ok) {
        setError(json.detail || json.error || "No se pudo eliminar el pedido.");
        return;
      }
      if (selected?.id === p.id) setSelected(null);
      await load();
    } finally {
      setEliminando(null);
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
                      <select
                        value={estadoFallback(p.estado_envio)}
                        onChange={(e) => actualizarEstado(p.id, e.target.value)}
                        className={`form-input ${CLASE_ESTADO[estadoFallback(p.estado_envio)]}`}
                      >
                        <option value="EN_PREPARACION">En preparación</option>
                        <option value="ENVIADO">Enviado</option>
                        <option value="ENTREGADO">Entregado</option>
                        <option value="CANCELADO">Cancelado</option>
                      </select>
                    </td>
                    <td style={{ textAlign: "right" }}>${(p.total_cop || 0).toLocaleString("es-CO")}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        onClick={() => { setSelected(p); setTransportadora(p.transportadora || ""); setGuia(p.guia_rastreo || ""); }}
                        style={{ color: "var(--color-accent)" }}
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => eliminarPedido(p)}
                        disabled={eliminando === p.id}
                        style={{ color: "#b3261e", marginLeft: "0.75rem" }}
                      >
                        {eliminando === p.id ? "Eliminando…" : "Eliminar"}
                      </button>
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

                <h3 style={{ marginTop: "1rem" }}>Dirección de envío</h3>
                <DireccionEnvioView datos={selected.direccion_envio} mostrarNotas={false} />

                <h3 style={{ marginTop: "1rem" }}>Observaciones del checkout</h3>
                {bloqueNota("Notas del cliente", selected.direccion_envio?.notas)}

                {selected.estado_envio === "CANCELADO" && selected.estado_pago === "APROBADO" && (
                  <p style={{ marginTop: "1rem", padding: "0.75rem", background: "#fde5e5", color: "#8a1c1c", borderRadius: "0.5rem" }}>
                    Este pedido está cancelado pero el pago fue aprobado. Cancelar no revierte el pago ni el stock.
                  </p>
                )}

                <h3 style={{ marginTop: "1rem" }}>Ficha de confección</h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {(selected.items || []).map((it, idx) => {
                    const item = it as Record<string, unknown>;
                    const cantidad = Number(item.cantidad) || 0;
                    const precio = Number(item.precio) || 0;
                    return (
                      <li key={idx} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", padding: "0.75rem 0" }}>
                        <div style={{ fontWeight: 600 }}>{String(item.nombre ?? "")}</div>
                        <div>Línea: {String(item.linea ?? "-")}</div>
                        <div style={{ fontWeight: 700 }}>
                          Color de hilo: {String(item.colorHilo || item.colorHiloHex || "-")}
                        </div>
                        <div>Talla: {String(item.talla || "-")}</div>
                        <div>Cantidad: {cantidad}</div>
                        <div>
                          Precio unitario: ${precio.toLocaleString("es-CO")} · Subtotal: $
                          {(precio * cantidad).toLocaleString("es-CO")}
                        </div>
                        {bloqueNota("Observaciones de la pieza", item.observaciones)}
                      </li>
                    );
                  })}
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

function DireccionEnvioView({
  datos,
  mostrarNotas = true,
}: {
  datos?: DireccionEnvio | null;
  mostrarNotas?: boolean;
}) {
  if (!datos) {
    return <p style={{ color: "rgba(0,0,0,0.5)" }}>Sin dirección registrada.</p>;
  }

  const lineas = [
    { label: "Nombre", valor: datos.nombre },
    { label: "Email", valor: datos.email },
    { label: "Teléfono", valor: datos.telefono },
    { label: "Dirección", valor: datos.direccion },
    { label: "Barrio", valor: datos.barrio },
    { label: "Ciudad", valor: datos.ciudad },
    { label: "Departamento", valor: datos.departamento },
    { label: "Código postal", valor: datos.codigoPostal },
  ].filter((l) => l.valor && String(l.valor).trim().length > 0);

  const hayNotas = Boolean(mostrarNotas && datos.notas && datos.notas.trim());
  const hayDatos = lineas.length > 0 || hayNotas;

  if (!hayDatos) {
    return <p style={{ color: "rgba(0,0,0,0.5)" }}>Sin dirección registrada.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
      {lineas.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.35rem 1rem" }}>
          {lineas.map((l) => (
            <li key={l.label} style={{ fontSize: "0.9rem" }}>
              <span style={{ color: "rgba(0,0,0,0.55)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>{l.label}</span>
              <span style={{ color: "var(--color-text)" }}>{l.valor}</span>
            </li>
          ))}
        </ul>
      )}
      {mostrarNotas && datos.notas && datos.notas.trim() && (
        <div style={{ marginTop: "0.5rem", padding: "0.75rem 1rem", background: "rgba(17,17,17,0.03)", borderRadius: "0.5rem" }}>
          <div style={ETIQUETA}>Observaciones</div>
          <p style={{ margin: "0.25rem 0 0", whiteSpace: "pre-wrap", fontStyle: "italic" }}>&ldquo;{datos.notas}&rdquo;</p>
        </div>
      )}
    </div>
  );
}