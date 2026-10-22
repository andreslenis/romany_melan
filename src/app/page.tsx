"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { PECADOS } from "@/lib/pecados";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);

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
              <h1 className="hero-title">ROMANY MELAN</h1>
              <p className="hero-subtitle">
                Historias tejidas para llevar en la piel.
              </p>
            </div>
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
              <span>
                Fotografía editorial
                <br />
                de la creadora
              </span>
            </div>
            <div className="author-content fade-in">
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
              <h2 className="section-title">1° Colección: Los 7 Pecados Capitales</h2>
              <p className="collection-intro">
                Te invitamos a un viaje íntimo hacia las facetas que definen la
                condición humana. Esta colección explora los matices de los siete
                pecados capitales como expresiones universales que hacen parte de
                nuestras emociones. Conoce la historia detrás de cada pecado y
                descubre cómo llevarlo adherido a la piel.
              </p>
            </header>
            <div className="cards-grid">
              {PECADOS.map((pecado) => {
                const contenido = (
                  <>
                    <div
                      className="card-media"
                      style={{ backgroundImage: `url('${pecado.imagen}')` }}
                    />
                    <div className="card-content">
                      <header className="card-header">
                        <span className="card-number">{pecado.numero}</span>
                        <h3 className="card-title">{pecado.titulo}</h3>
                        <p className="card-subtitle">{pecado.subtitulo}</p>
                      </header>
                      <footer className="card-footer">
                        <span
                          className={`card-badge ${
                            pecado.slug === "soberbia" ? "active" : ""
                          }`}
                          onClick={
                            pecado.slug !== "soberbia"
                              ? () => setModalOpen(true)
                              : undefined
                          }
                          style={
                            pecado.slug !== "soberbia"
                              ? { cursor: "pointer" }
                              : undefined
                          }
                        >
                          {pecado.slug === "soberbia"
                            ? "Descubrir el Brillo de Soberbia"
                            : "Revelar Historia Próximamente"}
                        </span>
                      </footer>
                    </div>
                  </>
                );

                return pecado.slug === "soberbia" ? (
                  <Link
                    key={pecado.slug}
                    href="/coleccion/soberbia"
                    className="card card--soberbia card--link"
                  >
                    {contenido}
                  </Link>
                ) : (
                  <article key={pecado.slug} className="card">
                    {contenido}
                  </article>
                );
              })}
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
            <p>Sé el primero en el Círculo en conocer este lanzamiento.</p>
            <input
              type="email"
              placeholder="tu@email.com"
              style={{ width: "100%", marginTop: "1rem", padding: "0.5rem" }}
            />
            <button
              className="cta-btn"
              style={{ marginTop: "1rem" }}
              onClick={() => setModalOpen(false)}
            >
              Enviar
            </button>
          </div>
        </div>
      )}

      <SiteFooter />
    </>
  );
}
