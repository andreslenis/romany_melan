"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { usePerfil } from "@/context/ProfileContext";
import { productosSingular } from "@/data/productos";
import { etapaActual, progresoEnvio, tiempoRestante } from "@/lib/envio";
import { ESTADOS_ENVIO, LINEAS_CORTAS, type Pedido } from "@/lib/types";
import { formatCOP } from "@/utils/format";

export default function PerfilPage() {
  return (
    <Suspense fallback={<PerfilSkeleton />}>
      <PerfilContent />
    </Suspense>
  );
}

function PerfilSkeleton() {
  return (
    <main className="profile-page">
      <div className="container">
        <p className="profile-empty">Cargando tu perfil…</p>
      </div>
    </main>
  );
}

function PerfilContent() {
  const { perfil, pedidos, solicitudes, hydrated, cerrarSesion } = usePerfil();
  const searchParams = useSearchParams();
  const pedidoResaltado = searchParams.get("pedido");
  const [ahora] = useState(() => Date.now());

  useEffect(() => {
    if (!perfil) return;
    let timeout: NodeJS.Timeout;
    const reset = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        cerrarSesion();
      }, 15 * 60 * 1000);
    };
    const events = ["mousemove", "keydown", "click", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => {
      clearTimeout(timeout);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [perfil, cerrarSesion]);

  const pedidoActivo = useMemo(() => {
    if (pedidos.length === 0) return null;
    return (
      pedidos.find((p) => p.id === pedidoResaltado) ?? pedidos[0]
    );
  }, [pedidos, pedidoResaltado]);

  const sinAcceso = hydrated && !perfil && pedidos.length === 0;

  if (!hydrated) {
    return (
      <>
        <SiteHeader />
        <PerfilSkeleton />
        <SiteFooter />
      </>
    );
  }

  if (sinAcceso) {
    return (
      <>
        <SiteHeader />
        <main className="profile-page">
          <div className="container profile-gate">
            <span className="profile-gate-seal" aria-hidden="true">
              ✦
            </span>
            <h1 className="profile-title">Acceso al Círculo</h1>
            <p className="profile-gate-text">
              Esta es un área privada para quienes hacen parte del Círculo.
              Inicia sesión para revisar el estado de tus pedidos y tus
              lanzamientos privados. Si aún no tienes perfil, créalo aquí.
            </p>
            <div className="profile-gate-actions">
              <Link href="/crear-perfil" className="cta-btn">
                Crear mi Perfil
              </Link>
              <Link href="/coleccion/soberbia" className="cta-btn">
                Ver la Colección
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="profile-page">
        <div className="container">
          <header className="profile-header">
            <div>
              <p className="profile-eyebrow">Área privada</p>
              <h1 className="profile-title">
                {perfil ? `Hola, ${perfil.nombre.split(" ")[0]}` : "Mi Perfil"}
              </h1>
              {perfil?.email && (
                <p className="profile-email">{perfil.email}</p>
              )}
              {perfil && perfil.proveedor !== "manual" && (
                <p className="profile-provider">
                  Cuenta conectada con{" "}
                  {perfil.proveedor === "google" ? "Google" : "Apple"}
                </p>
              )}
              {perfil && (
                <button
                  className="profile-logout"
                  onClick={cerrarSesion}
                  type="button"
                >
                  Cerrar sesión
                </button>
              )}
            </div>
            {perfil?.miembro && (
              <div className="member-badge">
                <span className="member-badge-seal" aria-hidden="true">
                  ✦
                </span>
                <span className="member-badge-body">
                  <span className="member-badge-title">Custodio del Círculo</span>
                  <span className="member-badge-sub">
                    Miembro desde {new Date(perfil.desde).toLocaleDateString("es-CO")}
                  </span>
                </span>
              </div>
            )}
          </header>

          <section className="profile-section">
            <h2 className="profile-section-title">Estado de envío</h2>
            {pedidoActivo ? (
              <EnvioTracker pedido={pedidoActivo} ahora={ahora} />
            ) : (
              <p className="profile-empty">
                No tienes envíos en curso. Cuando completes tu primera compra,
                aquí verás el seguimiento en tiempo real.
              </p>
            )}
          </section>

          <section className="profile-section">
            <h2 className="profile-section-title">Mis Historias</h2>
            {pedidos.length === 0 ? (
              <p className="profile-empty">
                Todavía no has adquirido ninguna pieza. Tu colección de
                certificados y relatos vive aquí.
              </p>
            ) : (
              <ul className="historias-list">
                {pedidos.map((pedido) => (
                  <HistoriaItem
                    key={pedido.id}
                    pedido={pedido}
                    destacado={pedido.id === pedidoResaltado}
                  />
                ))}
              </ul>
            )}
          </section>

          {solicitudes.length > 0 && (
            <section className="profile-section">
              <h2 className="profile-section-title">Mis Solicitudes</h2>
              <ul className="solicitudes-list">
                {solicitudes.map((solicitud) => (
                  <li className="solicitud" key={solicitud.id}>
                    <div>
                      <p className="solicitud-nombre">{solicitud.nombre}</p>
                      <p className="solicitud-meta">
                        {LINEAS_CORTAS[solicitud.linea]} ·{" "}
                        {new Date(solicitud.fecha).toLocaleDateString("es-CO")}
                      </p>
                    </div>
                    <span className="solicitud-tag">Lista de espera</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="profile-section profile-section--teaser">
            <h2 className="profile-section-title">Próximos Lanzamientos</h2>
            <p className="profile-teaser-intro">
              La Línea Singular en Oro Macizo 18K se abre por primera vez para los
              miembros del Círculo. Cada pieza se numera y se entrega con
              certificado de origen.
            </p>
            <div className="teaser-grid">
              {productosSingular.map((lanzamiento) => (
                <article className="teaser-card" key={lanzamiento.slug}>
                  <div className="teaser-media">
                    <Image
                      src={lanzamiento.imagen}
                      alt={lanzamiento.nombre}
                      fill
                      unoptimized={lanzamiento.imagenSinOptimizar}
                      sizes="(max-width: 768px) 100vw, 25vw"
                      style={{ objectFit: "cover" }}
                    />
                    <span className="teaser-lock">Próximamente</span>
                  </div>
                  <div className="teaser-body">
                    <h3 className="teaser-name">{lanzamiento.nombre}</h3>
                    <p className="teaser-line">{lanzamiento.material}</p>
                    <p className="teaser-note">{lanzamiento.insignia}</p>
                    <Link
                      className="teaser-link"
                      href={`/producto/${lanzamiento.slug}`}
                    >
                      {perfil ? "Ver Producto" : "Solicitar Acceso"}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function EnvioTracker({ pedido, ahora }: { pedido: Pedido; ahora: number }) {
  const estado = etapaActual(pedido, ahora);
  const progreso = progresoEnvio(pedido, ahora);
  const indiceActual = ESTADOS_ENVIO.findIndex((e) => e.id === estado);

  return (
    <div className="tracker">
      <div className="tracker-head">
        <div>
          <p className="tracker-ref">Pedido {pedido.referencia}</p>
          <p className="tracker-status">
            {ESTADOS_ENVIO[indiceActual]?.label}
          </p>
        </div>
        <span className="tracker-percent">{progreso}%</span>
      </div>

      <div className="tracker-bar">
        <div className="tracker-bar-fill" style={{ width: `${progreso}%` }} />
      </div>

      <ol className="tracker-steps">
        {ESTADOS_ENVIO.map((etapa, index) => (
          <li
            key={etapa.id}
            className={`tracker-step ${index <= indiceActual ? "done" : ""} ${
              index === indiceActual ? "current" : ""
            }`}
          >
            <span className="tracker-dot" aria-hidden="true" />
            <span className="tracker-step-label">{etapa.label}</span>
            <span className="tracker-step-desc">{etapa.descripcion}</span>
          </li>
        ))}
      </ol>

      <p className="tracker-eta">{tiempoRestante(pedido, ahora)}</p>
    </div>
  );
}

function HistoriaItem({
  pedido,
  destacado,
}: {
  pedido: Pedido;
  destacado: boolean;
}) {
  const fecha = new Date(pedido.fecha).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <li className={`historia ${destacado ? "historia--destacada" : ""}`}>
      <div className="historia-head">
        <div>
          <h3 className="historia-title">{fecha}</h3>
          <p className="historia-ref">
            {pedido.referencia} · {pedido.metodoPago} · {pedido.totalFormato}
          </p>
        </div>
        {pedido.esMiembro && (
          <span className="historia-tag">Custodio del Círculo</span>
        )}
      </div>

      <ul className="historia-items">
        {pedido.items.map((item) => (
          <li
            className="historia-item"
            key={`${item.slug}-${item.talla ?? "s"}-${item.colorHilo ?? "-"}`}
          >
            <div className="historia-item-media">
              <Image
                src={item.imagen}
                alt={item.nombre}
                fill
                sizes="80px"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="historia-item-body">
              <p className="historia-item-name">{item.nombre}</p>
              <p className="historia-item-line">
                {item.linea}
                {item.talla ? ` · Talla ${item.talla}` : ""} · {item.cantidad} und.
              </p>
              {item.colorHilo && (
                <p className="historia-item-color">
                  <span
                    className="color-swatch color-swatch--static"
                    style={{ backgroundColor: item.colorHiloHex ?? undefined }}
                    aria-hidden="true"
                  />
                  Hilo {item.colorHilo}
                </p>
              )}
              {item.observaciones && (
                <p className="historia-item-notes">“{item.observaciones}”</p>
              )}
            </div>
            <span className="historia-item-price">
              {formatCOP(item.precio * item.cantidad)}
            </span>
          </li>
        ))}
      </ul>

      {pedido.direccion.notas && (
        <div className="historia-observaciones">
          <p className="historia-item-line">Observaciones del comprador</p>
          <p className="historia-item-notes">“{pedido.direccion.notas}”</p>
        </div>
      )}

      <details className="certificado">
        <summary>Ver certificado digital de la pieza</summary>
        <div className="certificado-body">
          <p className="certificado-numero">Certificado {pedido.certificado}</p>
          <p>
            Esta pieza fue tejida a mano en el taller Romany Melan y sirve como
            garantía de origen. Conserva este número para verificar la
            autenticidad de tu pieza y para acceder a su relato.
          </p>
          <p className="certificado-meta">
            Registrado para {pedido.direccion.nombre} · {pedido.direccion.email}
          </p>
        </div>
      </details>
    </li>
  );
}
