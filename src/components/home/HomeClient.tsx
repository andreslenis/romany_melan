"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import HeroBanner from "@/components/home/HeroBanner";
import CollectionBannerCarousel from "@/components/home/CollectionBannerCarousel";
import ProductCarousel from "@/components/home/ProductCarousel";
import { usePerfil } from "@/context/ProfileContext";
import type { Coleccion } from "@/lib/types";
import type { ProductoDB } from "@/lib/supabase/queries";

interface HomeClientProps {
  colecciones: Coleccion[];
  productosDestacados: ProductoDB[];
}

export default function HomeClient({ colecciones, productosDestacados }: HomeClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSlug, setModalSlug] = useState("");
  const [modalNombre, setModalNombre] = useState("");
  const { solicitarEspera } = usePerfil();
  const [emailEspera, setEmailEspera] = useState("");
  const [esperaEnviada, setEsperaEnviada] = useState(false);

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
        {colecciones.some((c) => c.modo_acceso === "activa" && c.banner_activo) ? (
          <CollectionBannerCarousel colecciones={colecciones} />
        ) : (
          <HeroBanner />
        )}
        <ProductCarousel productos={productosDestacados} />

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
              {colecciones.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem" }}>No hay colecciones disponibles.</div>
              ) : (
                colecciones.map((c) => {
                  const esActiva = c.modo_acceso === "activa";
                  const esProximamente = c.modo_acceso === "proximamente";
                  const contenido = (
                    <>
                      <div
                        className={`card-media${esProximamente ? " card-media--proximamente" : ""}`}
                        style={{
                          backgroundImage: c.foto_url ? `url('${c.foto_url}')` : "none",
                          backgroundColor: c.acento_color_hex ? `${c.acento_color_hex}20` : undefined,
                        }}
                      />
                      <div className="card-hover-mask">
                        <span className="card-hover-text">Ver Colección</span>
                      </div>
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
              <h2 className="section-title">La Autora & El Origen</h2>
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