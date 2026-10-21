import Link from "next/link";
import Image from "next/image";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "La Autora & El Origen | Romany Melan",
  description:
    "Conoce a Melany Roman, fundadora de Romany Melan. Micro-macramé, técnicas, materiales y todo lo referente a la marca.",
};

export default function AutoraPage() {
  return (
    <>
      <SiteHeader />

      <main id="autora">
        <section className="author-hero">
          <div className="container author-hero-content">
            <div className="author-hero-media">
              <Image
                src="/resources/isotipo.png"
                alt="Romany Melan"
                fill
                priority
                sizes="(max-width: 768px) 70vw, 380px"
                style={{ objectFit: "contain" }}
              />
            </div>
            <div className="author-hero-text">
              <h1 className="section-title">La Autora &amp; El Origen</h1>
              <p className="author-hero-subtitle">
                Detrás de cada nudo hay una historia, una técnica y una marca
                hecha a mano.
              </p>
            </div>
          </div>
        </section>

        <section className="author-section" id="sobre-la-autora">
          <div className="container author-grid">
            <div className="author-image">
              <span>
                Fotografía editorial<br />
                de la creadora
              </span>
            </div>
            <div className="author-content fade-in">
              <h2 className="section-title">Sobre Melany Roman</h2>
              <div className="author-text">
                <p>
                  Soy Melany Roman y cada joya que llevas puesta ha sido
                  imaginada y tejida directamente por mis manos. Fundé Romany
                  Melan para rendir tributo a la belleza de lo auténtico y lo
                  hecho a mano.
                </p>
                <p>
                  Mi camino con el macramé nació de la necesidad de crear algo
                  que durara, algo que no fuera desechable. Cada pieza es un
                  encuentro atemporal donde el arte, la piedra y la fibra se
                  entrelazan para contar una historia entre la creación y quien
                  la porta.
                </p>
                <p>
                  Para mí, tejer es un acto de presencia. Cada nudo se hace con
                  intención, y cada joya está diseñada para acompañar y resonar
                  con la historia de quien la porta.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="author-section" id="tecnicas">
          <div className="container">
            <header className="collection-header fade-in">
              <h2 className="section-title">Técnicas</h2>
              <p className="collection-intro">
                Todo lo que hacemos nace de procesos pacientes y minuciosos,
                realizados a mano uno a uno.
              </p>
            </header>
            <div className="techniques-grid">
              <article className="technique-card fade-in">
                <div className="technique-icon">✦</div>
                <h3>Micro-macramé</h3>
                <p>
                  Técnica de nudado fino con hilo de alta tenacidad. Cada nudo
                  teje memoria, intención y emoción, transformando la fibra en
                  piezas únicas.
                </p>
              </article>
              <article className="technique-card fade-in">
                <div className="technique-icon">✦</div>
                <h3>Oro Laminado 18K</h3>
                <p>
                  Componentes en oro laminado 18K (Gold-Filled), resistentes y
                  con el brillo del macizo, usados en la Línea Origen.
                </p>
              </article>
              <article className="technique-card fade-in">
                <div className="technique-icon">✦</div>
                <h3>Oro Macizo 18K</h3>
                <p>
                  Metal macizo labrado en frío, usado en la Línea Singular.
                  Ediciones limitadas e invariables, con certificado de origen.
                </p>
              </article>
              <article className="technique-card fade-in">
                <div className="technique-icon">✦</div>
                <h3>Gemas Naturales</h3>
                <p>
                  Amatista natural pulida y gemas de selección especial
                  escogidas por la autora, integradas en cada diseño.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="author-section" id="la-marca">
          <div className="container author-grid">
            <div className="brand-content fade-in">
              <h2 className="section-title">Romany Melan</h2>
              <div className="brand-text">
                <p>
                  Romany Melan celebra la belleza en su estado más puro y
                  orgánico, rindiendo culto a la fuerza de la naturaleza.
                </p>
                <p>
                  Nuestras colecciones exploran la condición humana a través de
                  emociones universales, llevadas adheridas a la piel como
                  relatos tejidos.
                </p>
                <p>
                  Cada pieza nace del diálogo entre la materia, la emoción y la
                  memoria. Minerales, gemas y nudos hechos a mano se entrelazan
                  para dar forma a historias vivas que se adhieren a la piel.
                </p>
              </div>
            </div>
            <div className="brand-statement">
              <blockquote className="brand-quote fade-in">
                «Historias vivas que se llevan en la piel.»
              </blockquote>
              <p className="brand-sign">
                — Melany Roman, fundadora de Romany Melan
              </p>
            </div>
          </div>
        </section>

        <section className="author-section" style={{ paddingBottom: "clamp(4rem, 10vw, 8rem)" }}>
          <div className="container">
            <div className="author-gate-actions" style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/coleccion/soberbia" className="cta-btn">
                Ver la Colección
              </Link>
              <Link href="/mi-perfil" className="cta-btn">
                Mi Perfil
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
