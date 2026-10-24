"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

type Pedido = {
  id: string;
  cliente_nombre?: string;
  cliente_email?: string;
  cliente_telefono?: string;
  items?: unknown[];
  total_cop?: number;
  created_at?: string;
};

type Perfil = {
  id: string;
  user_id?: string;
  nombre?: string;
  email?: string;
  telefono?: string;
  miembro?: boolean;
};

type Cliente = {
  email: string;
  nombre: string;
  telefono: string;
  esMiembro: boolean;
  pedidos: Pedido[];
  total: number;
  ultimo: string;
};

export default function AdminClientes() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [filtro, setFiltro] = useState<"todos" | "miembros" | "invitados">("todos");
  const [selected, setSelected] = useState<Cliente | null>(null);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("pedidos").select("*");
      const { data: prof } = await supabase.from("perfiles").select("*");
      setPedidos(p || []);
      setPerfiles(prof || []);
    })();
  }, []);

  const clientesMap = new Map<string, Cliente>();
  for (const ped of pedidos) {
    const email = (ped.cliente_email || "").toLowerCase();
    if (!email) continue;
    if (!clientesMap.has(email)) {
      const perfil = perfiles.find((pr) => (pr.email || "").toLowerCase() === email);
      clientesMap.set(email, {
        email,
        nombre: ped.cliente_nombre || perfil?.nombre || "Sin nombre",
        telefono: ped.cliente_telefono || perfil?.telefono || "",
        esMiembro: Boolean(perfil),
        pedidos: [],
        total: 0,
        ultimo: ""
      });
    }
    const c = clientesMap.get(email)!;
    c.pedidos.push(ped);
    c.total += Number(ped.total_cop) || 0;
    if (!c.ultimo || new Date(ped.created_at || "").getTime() > new Date(c.ultimo).getTime()) {
      c.ultimo = ped.created_at || "";
    }
  }

  const clientes = Array.from(clientesMap.values()).filter((c) => {
    if (filtro === "miembros") return c.esMiembro;
    if (filtro === "invitados") return !c.esMiembro;
    return true;
  });

  const totalClientes = clientesMap.size;
  const totalMiembros = Array.from(clientesMap.values()).filter((c) => c.esMiembro).length;
  const totalInvitados = totalClientes - totalMiembros;

  return (
    <AdminGuard>
      <main className="container" style={{ padding: "2rem 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h1>CRM de Clientes / El Círculo</h1>
          <Link href="/admin/dashboard" className="cta-btn">Volver</Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.75rem", padding: "1.5rem" }}>
            <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(0,0,0,0.5)" }}>Total Clientes</div>
            <div style={{ fontSize: "2rem", fontWeight: 600 }}>{totalClientes}</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.75rem", padding: "1.5rem" }}>
            <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(0,0,0,0.5)" }}>Miembros del Círculo</div>
            <div style={{ fontSize: "2rem", fontWeight: 600 }}>{totalMiembros}</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.75rem", padding: "1.5rem" }}>
            <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(0,0,0,0.5)" }}>Compradores Invitados</div>
            <div style={{ fontSize: "2rem", fontWeight: 600 }}>{totalInvitados}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          {(["todos", "miembros", "invitados"] as const).map((f) => (
            <button key={f} className="cta-btn" style={{ opacity: filtro === f ? 1 : 0.5 }} onClick={() => setFiltro(f)}>
              {f === "todos" ? "Todos" : f === "miembros" ? "Solo Miembros" : "Invitados"}
            </button>
          ))}
        </div>

        <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "0.75rem", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                <th style={{ padding: "1rem", textAlign: "left" }}>Nombre</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>Email / Teléfono</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>Estado</th>
                <th style={{ padding: "1rem", textAlign: "center" }}>Pedidos</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Total COP</th>
                <th style={{ padding: "1rem", textAlign: "left" }}>Último pedido</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.email} style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  <td style={{ padding: "1rem" }}>{c.nombre}</td>
                  <td style={{ padding: "1rem" }}>
                    <div>{c.email}</div>
                    <div style={{ fontSize: "0.8rem", color: "rgba(0,0,0,0.5)" }}>{c.telefono}</div>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {c.esMiembro ? (
                      <span style={{ background: "#c9a227", color: "#fff", padding: "0.25rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem" }}>Miembro del Círculo</span>
                    ) : (
                      <span style={{ background: "#999", color: "#fff", padding: "0.25rem 0.6rem", borderRadius: "999px", fontSize: "0.75rem" }}>Comprador Invitado</span>
                    )}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>{c.pedidos.length}</td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>${c.total.toLocaleString("es-CO")} COP</td>
                  <td style={{ padding: "1rem" }}>{c.ultimo ? new Date(c.ultimo).toLocaleDateString("es-CO") : "-"}</td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button onClick={() => setSelected(c)} style={{ color: "var(--color-accent)" }}>Ver Historial</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }} onClick={() => setSelected(null)}>
            <div style={{ background: "#fff", borderRadius: "0.75rem", padding: "2rem", maxWidth: "640px", width: "90%", maxHeight: "80vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ marginBottom: "1rem" }}>{selected.nombre}</h2>
              <p style={{ color: "rgba(0,0,0,0.6)", marginBottom: "1rem" }}>{selected.email} · {selected.telefono}</p>
              <h3 style={{ marginBottom: "0.5rem" }}>Historial de joyas</h3>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {selected.pedidos.map((ped) => (
                  <li key={ped.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", padding: "0.75rem 0" }}>
                    <div style={{ fontWeight: 500 }}>{ped.created_at ? new Date(ped.created_at).toLocaleDateString("es-CO") : ""}</div>
                    <div style={{ fontSize: "0.9rem" }}>
                      {((ped.items as Record<string, unknown>[]) || []).map((it: Record<string, unknown>, idx: number) => (
                        <span key={idx}>{String(it.nombre)} ({String(it.linea)}){idx < (ped.items || []).length - 1 ? ", " : ""}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "rgba(0,0,0,0.5)" }}>${(ped.total_cop || 0).toLocaleString("es-CO")} COP</div>
                  </li>
                ))}
              </ul>
              {selected.telefono && (
                <a
                  href={"https://wa.me/" + selected.telefono.replace(/\D/g, "") + "?text=" + encodeURIComponent("Hola " + selected.nombre + ", gracias por ser parte de Romany Melan.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cta-btn"
                  style={{ display: "inline-block", marginTop: "1rem" }}
                >
                  Enviar WhatsApp
                </a>
              )}
              <button className="cta-btn" style={{ marginTop: "1rem", marginLeft: "0.5rem" }} onClick={() => setSelected(null)}>Cerrar</button>
            </div>
          </div>
        )}
      </main>
    </AdminGuard>
  );
}
