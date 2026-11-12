"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { usePerfil } from "@/context/ProfileContext";
import { supabase } from "@/lib/supabase/client";
import type { Coleccion } from "@/lib/types";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSlug, setModalSlug] = useState("");
  const [modalNombre, setModalNombre] = useState("");
  const [colecciones, setColecciones] = useState<Coleccion[]>([]);
  const [loading, setLoading] = useState(true);
  const { solicitarEspera } = usePerfil();
  const [emailEspera, setEmailEspera] = useState("");
  const [esperaEnviada, setEsperaEnviada] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("colecciones").select("*").order("nombre");
      const cols = (data || []) as Coleccion[];
      setColecciones(cols.filter((c) => c.modo_acceso !== "inactiva"));
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleEspera = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = emailEspera.trim();
    if (!email) return;
    solicitarEspera({
      slug: modalSlug,
      nombre: modalNombre,
      email,
      linea: "origen",
    });
    setEmailEspera("");
    setEsperaEnviada(true);
    setTimeout(() => setEsperaEnviada(false), 4000);
  };

  return (
    <>
      <SiteHeader />

      <main id="inicio">
        <section className="hero">
          <div className="container hero-content fade-in">
            <div className="hero-brand">
              <div className="hero-isotipo">
                <Image
                  src="/resources/isotipo.png"
                  alt="Romany Melan"
                  fill
                  priority
                  sizes="(max-width: 768px) 70vw, 380px"
                  style={{ objectFit: "contain" }}
                />
              </div>
              <h1 className="hero-title" style={{ color: "var(--color-accent)" }}>ROMANY MELAN</h1>
              <p className="hero-subtitle">
                Historias para llevar en la piel.
              </p>
            </div>
            <h3 className="section-subtitle">— EL ORIGEN Y LA MATERIA</h3>
            <p className="hero-text">
              Romany Melan celebra la belleza en su estado más puro y orgánico,
              rindiendo culto a la fuerza de la naturaleza. Cada pieza es un
              encuentro atemporal donde el arte, la piedra y la fibra se entrelazan
              para contar una historia entre la joya y quien la porta.
            </p>
            <a className="cta-btn" href="#coleccion">
              Adentrarse en las Historias
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.33334 8H12.6667" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 3.33334L12.6667 8L8 12.6667" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </section>

        <section className="author-section" id="autora">
          <div className="container author-grid">
            <div className="author-image">
              <Image
                src="/resources/autora/melany_roman.jpg"
                alt="Melany Roman, creadora de Romany Melan"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
            <div className="author-content fade-in">
              <h3 className="section-subtitle">— LA CREADORA</h3>
              <h2 className="section-title">La Autora &amp; El Origen</h2>
            <div className="author-text">
              <p>
                Soy Melany Roman y cada joya que llevas puesta ha sido imaginada
                y tejida directamente por mis manos; fundé Romany Melan para
                rendir tributo a la belleza de lo auténtico y lo hecho a mano.
              </p>
              <p>
                Encuentro en la técnica del micro-macramé mi lenguaje principal:
                un arte donde cada nudo teje memoria, intención y emoción.
              </p>
              <p>
                A través de este proceso paciente y minucioso, transformo la
                fibra, las gemas y los metales nobles en piezas únicas,
                diseñadas para acompañar y resonar con la historia de quien las
                porta.
              </p>
              <Link href="/autora" className="cta-btn">
                Conoce a la Autora
              </Link>
            </div>
            </div>
          </div>
        </section>

        <section className="collection-section" id="coleccion">
          <div className="container">
            <header className="collection-header fade-in">
              <Link href="#coleccion" className="cta-btn" style={{ display: "inline-block", marginBottom: "1rem" }}>
                Colecciones
              </Link>
              <p className="collection-intro">
                Explora nuestras colecciones. Cada una tiene su propia historia,
                color y camino. Elige la que resuene contigo.
              </p>
            </header>
            <div className="cards-grid">
              {loading ? (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem" }}>Cargando colecciones…</div>
              ) : colecciones.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem" }}>No hay colecciones disponibles.</div>
              ) : (
                colecciones.map((c) => {
                  const esActiva = c.modo_acceso === "activa";
                  const contenido = (
                    <>
                      <div
                        className="card-media"
                        style={{
                          backgroundImage: c.foto_url ? `url('${c.foto_url}')` : "none",
                          backgroundColor: c.acento_color_hex ? `${c.acento_color_hex}20` : undefined,
                        }}
                      />
                      <div className="card-content">
                        <header className="card-header">
                          <h3 className="card-title">{c.nombre}</h3>
                          {c.lema && <p className="card-subtitle">{c.lema}</p>}
                        </header>
                        <footer className="card-footer">
                          <span
                            className="card-badge"
                            onClick={
                              esActiva || c.modo_acceso === "proximamente"
                                ? undefined
                                : undefined
                            }
                          >
                            {c.texto_boton || "Ingresar a la Colección"}
                          </span>
                        </footer>
                      </div>
                    </>
                  );

                  if (esActiva) {
                    return (
                      <Link
                        key={c.id}
                        href={`/coleccion/${c.slug}`}
                        className="card card--link"
                      >
                        {contenido}
                      </Link>
                    );
                  }

                  if (c.modo_acceso === "proximamente") {
                    return (
                      <article
                        key={c.id}
                        className="card"
                        onClick={() => {
                          setModalSlug(c.slug);
                          setModalNombre(c.nombre);
                          setModalOpen(true);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {contenido}
                      </article>
                    );
                  }

                  return null;
                })
              )}
            </div>
          </div>
        </section>
      </main>

      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              padding: "2rem",
              borderRadius: "8px",
              maxWidth: "420px",
              width: "90%",
              textAlign: "center",
            }}
          >
            <p>Sé el primero en conocer el estreno de <strong>{modalNombre}</strong>.</p>
            {!esperaEnviada ? (
              <>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={emailEspera}
                  onChange={(e) => setEmailEspera(e.target.value)}
                  style={{ width: "100%", marginTop: "1rem", padding: "0.5rem" }}
                />
                <button
                  className="cta-btn"
                  style={{ marginTop: "1rem" }}
                  onClick={(e) => { e.preventDefault(); handleEspera(e as unknown as React.FormEvent<HTMLFormElement>); }}
                >
                  Avísame cuando se estrene
                </button>
              </>
            ) : (
              <>
                <p style={{ marginTop: "1rem", color: "var(--color-accent)", fontWeight: 600 }}>
                  Te avisaremos por correo cuando {modalNombre} se estrene.
                </p>
                <button
                  className="cta-btn"
                  style={{ marginTop: "1rem" }}
                  onClick={() => setModalOpen(false)}
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <SiteFooter />
    </>
  );
}
