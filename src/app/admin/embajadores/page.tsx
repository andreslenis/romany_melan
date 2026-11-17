"use client";

import { useCallback, useEffect, useState } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import { supabase } from "@/lib/supabase/client";

type Embajador = {
  id: string;
  nombre: string;
  telefono: string;
  codigo: string;
  activo: boolean;
  comision_acumulada: number;
  comision_pendiente: number;
  ultima_liquidacion: string | null;
  usos_totales: number;
  created_at: string;
};

type Comision = {
  id: string;
  pedido_id: string;
  codigo_usado: string;
  subtotal_productos: number;
  descuento_aplicado: number;
  total_con_descuento: number;
  comision_porcentaje: number;
  comision_monto: number;
  estado: string;
  created_at: string;
  pedido_numero?: string;
};

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatCOP(value: number): string {
  return `$${value.toLocaleString("es-CO")} COP`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function AdminEmbajadores() {
  const [embajadores, setEmbajadores] = useState<Embajador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmbajador, setSelectedEmbajador] = useState<Embajador | null>(null);
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [comisionesLoading, setComisionesLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({ nombre: "", telefono: "", codigo: "", activo: true });
  const [submitting, setSubmitting] = useState(false);

  const loadEmbajadores = useCallback(async () => {
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/admin/embajadores", { headers, cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.detail || json.error || `http_${res.status}`);
      }
      setEmbajadores(json.embajadores || []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudieron cargar los embajadores.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEmbajadores(); }, [loadEmbajadores]);

  const loadComisiones = useCallback(async (embajadorId: string) => {
    setComisionesLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/admin/embajadores?embajador_id=${embajadorId}`, { headers, cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.detail || json.error || `http_${res.status}`);
      }
      setComisiones(json.comisiones || []);
    } catch (e) {
      console.error("Error cargando comisiones:", e);
    } finally {
      setComisionesLoading(false);
    }
  }, []);

  const handleSelectEmbajador = useCallback((emb: Embajador) => {
    setSelectedEmbajador(emb);
    loadComisiones(emb.id);
  }, [loadComisiones]);

  const handleCreateClick = () => {
    setFormData({ nombre: "", telefono: "", codigo: "", activo: true });
    setShowCreateModal(true);
    setShowEditModal(false);
  };

  const handleEditClick = (emb: Embajador) => {
    setFormData({ nombre: emb.nombre, telefono: emb.telefono, codigo: emb.codigo, activo: emb.activo });
    setShowEditModal(true);
    setShowCreateModal(false);
    setSelectedEmbajador(emb);
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedEmbajador(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
      const url = showCreateModal ? "/api/admin/embajadores" : `/api/admin/embajadores?id=${selectedEmbajador?.id}`;
      const method = showCreateModal ? "POST" : "PATCH";
      const res = await fetch(url, { method, headers, body: JSON.stringify(formData) });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.detail || json.error || "Error al guardar");
      }
      handleCloseModals();
      loadEmbajadores();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al guardar";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLiquidar = async (embajadorId: string) => {
    if (!window.confirm("¿Marcar comisiones pendientes como pagadas? Esto moverá la comisión pendiente a acumulada y la pondrá en cero.")) return;
    setError(null);
    try {
      const headers = { "Content-Type": "application/json", ...(await authHeaders()) };
      const res = await fetch("/api/admin/embajadores/liquidar", {
        method: "POST",
        headers,
        body: JSON.stringify({ embajador_id: embajadorId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.detail || json.error || "Error al liquidar");
      }
      loadEmbajadores();
      if (selectedEmbajador?.id === embajadorId) {
        loadComisiones(embajadorId);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al liquidar";
      setError(msg);
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
                <h1 className="admin-page-title">Gestor de Embajadores</h1>
                <p className="admin-page-subtitle">
                  Administrar embajadores, códigos de descuento y comisiones.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="cta-btn" onClick={handleCreateClick}>Nuevo Embajador</button>
              <a href="/admin/dashboard" className="cta-btn admin-btn--back">Volver</a>
            </div>
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
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Código</th>
                  <th>Estado</th>
                  <th>Usos</th>
                  <th>Com. Acumulada</th>
                  <th>Com. Pendiente</th>
                  <th>Últ. Liquidación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ padding: "2rem", textAlign: "center" }}>Cargando…</td></tr>
                ) : embajadores.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: "2rem", textAlign: "center", color: "rgba(17,17,17,0.5)" }}>No hay embajadores registrados.</td></tr>
                ) : embajadores.map((emb) => (
                  <tr key={emb.id}>
                    <td>{emb.nombre}</td>
                    <td>{emb.telefono}</td>
                    <td><code style={{ background: "#f5f5f5", padding: "0.15rem 0.4rem", borderRadius: "0.25rem" }}>{emb.codigo}</code></td>
                    <td>
                      <span className={emb.activo ? "estado-activo" : "estado-inactivo"}>
                        {emb.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>{emb.usos_totales}</td>
                    <td style={{ textAlign: "right" }}>{formatCOP(emb.comision_acumulada)}</td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: emb.comision_pendiente > 0 ? "#2d7a2d" : "inherit" }}>
                      {formatCOP(emb.comision_pendiente)}
                    </td>
                    <td>{formatDate(emb.ultima_liquidacion)}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        onClick={() => handleEditClick(emb)}
                        style={{ color: "var(--color-accent)", marginRight: "0.5rem" }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleSelectEmbajador(emb)}
                        style={{ color: "var(--color-accent)", marginRight: "0.5rem" }}
                      >
                        Ver Comisiones
                      </button>
                      {emb.comision_pendiente > 0 && (
                        <button
                          onClick={() => handleLiquidar(emb.id)}
                          className="cta-btn"
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                        >
                          Marcar Pagado
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal Ver Comisiones */}
          {selectedEmbajador && (
            <div
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
              onClick={handleCloseModals}
            >
              <div
                style={{ background: "#fff", borderRadius: "0.75rem", padding: "2rem", maxWidth: "900px", width: "90%", maxHeight: "80vh", overflow: "auto" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <h2>Comisiones de {selectedEmbajador.nombre} ({selectedEmbajador.codigo})</h2>
                  <button onClick={handleCloseModals} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
                </div>

                <div style={{ marginBottom: "1rem", padding: "1rem", background: "#faf9f6", borderRadius: "0.5rem", display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                  <div><strong>Comisión Acumulada:</strong> {formatCOP(selectedEmbajador.comision_acumulada)}</div>
                  <div><strong>Comisión Pendiente:</strong> {formatCOP(selectedEmbajador.comision_pendiente)}</div>
                  <div><strong>Total Usos Código:</strong> {selectedEmbajador.usos_totales}</div>
                  <div><strong>Última Liquidación:</strong> {formatDate(selectedEmbajador.ultima_liquidacion)}</div>
                </div>

                {comisionesLoading ? (
                  <p style={{ textAlign: "center", padding: "2rem" }}>Cargando comisiones…</p>
                ) : comisiones.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "2rem", color: "rgba(17,17,17,0.5)" }}>No hay comisiones registradas.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid #e5e0d8" }}>
                          <th style={{ textAlign: "left", padding: "0.75rem" }}>Pedido</th>
                          <th style={{ textAlign: "left", padding: "0.75rem" }}>Fecha</th>
                          <th style={{ textAlign: "right", padding: "0.75rem" }}>Subtotal</th>
                          <th style={{ textAlign: "right", padding: "0.75rem" }}>Descuento</th>
                          <th style={{ textAlign: "right", padding: "0.75rem" }}>Total c/ Desc.</th>
                          <th style={{ textAlign: "right", padding: "0.75rem" }}>Comisión (10%)</th>
                          <th style={{ textAlign: "center", padding: "0.75rem" }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comisiones.map((com) => (
                          <tr key={com.id} style={{ borderBottom: "1px solid #f0ebe5" }}>
                            <td style={{ padding: "0.75rem" }}>
                              <code style={{ background: "#f5f5f5", padding: "0.15rem 0.4rem", borderRadius: "0.25rem" }}>
                                {com.pedido_numero || com.pedido_id.slice(0, 8)}
                              </code>
                            </td>
                            <td style={{ padding: "0.75rem" }}>{formatDate(com.created_at)}</td>
                            <td style={{ textAlign: "right", padding: "0.75rem" }}>{formatCOP(com.subtotal_productos)}</td>
                            <td style={{ textAlign: "right", padding: "0.75rem", color: "#2d7a2d" }}>-{formatCOP(com.descuento_aplicado)}</td>
                            <td style={{ textAlign: "right", padding: "0.75rem" }}>{formatCOP(com.total_con_descuento)}</td>
                            <td style={{ textAlign: "right", padding: "0.75rem", fontWeight: 600 }}>{formatCOP(com.comision_monto)}</td>
                            <td style={{ textAlign: "center", padding: "0.75rem" }}>
                              <span className={com.estado === "pagada" ? "estado-pagada" : com.estado === "confirmada" ? "estado-confirmada" : "estado-pendiente"}>
                                {com.estado === "pagada" ? "Pagada" : com.estado === "confirmada" ? "Confirmada" : "Pendiente"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modal Crear/Editar */}
          {(showCreateModal || showEditModal) && (
            <div
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
              onClick={handleCloseModals}
            >
              <div
                style={{ background: "#fff", borderRadius: "0.75rem", padding: "2rem", maxWidth: "500px", width: "90%", maxHeight: "80vh", overflow: "auto" }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 style={{ marginBottom: "1.5rem" }}>{showCreateModal ? "Nuevo Embajador" : "Editar Embajador"}</h2>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      <span style={{ fontWeight: 500 }}>Nombre *</span>
                      <input
                        className="form-input"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleFormChange}
                        required
                        placeholder="Nombre completo del embajador"
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      <span style={{ fontWeight: 500 }}>Teléfono *</span>
                      <input
                        className="form-input"
                        name="telefono"
                        type="tel"
                        value={formData.telefono}
                        onChange={handleFormChange}
                        required
                        placeholder="+57 300 123 4567"
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      <span style={{ fontWeight: 500 }}>Código de descuento *</span>
                      <input
                        className="form-input"
                        name="codigo"
                        value={formData.codigo}
                        onChange={handleFormChange}
                        required
                        placeholder="CODIGO123"
                        style={{ textTransform: "uppercase" }}
                        disabled={showEditModal}
                      />
                      {showEditModal && <small style={{ color: "rgba(17,17,17,0.5)" }}>El código no se puede cambiar</small>}
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input
                        type="checkbox"
                        name="activo"
                        checked={formData.activo}
                        onChange={handleFormChange}
                      />
                      <span>Activo</span>
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                    <button type="button" className="cta-btn pdp-add-btn--outline" onClick={handleCloseModals}>Cancelar</button>
                    <button type="submit" className="cta-btn" disabled={submitting}>
                      {submitting ? "Guardando…" : showCreateModal ? "Crear" : "Actualizar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </AdminGuard>
  );
}