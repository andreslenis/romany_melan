"use client";

import Link from "next/link";
import Image from "next/image";

export default function HeroBanner() {
  return (
    <section className="hero-banner" aria-labelledby="hero-title">
      <div className="hero-banner-bg">
        <Image
          src="/resources/colecciones/soberbia/origen/gargantilla_soberbia_sutil/gargantilla_soberbia_sutil_soberbia.jpg"
          alt=""
          fill
          priority
          className="hero-banner-image"
          sizes="100vw"
        />
        <div className="hero-banner-overlay" aria-hidden="true" />
      </div>
      <div className="container hero-banner-content">
        <div className="hero-banner-text">
          <div className="hero-banner-logo" aria-hidden="true">
            <Image
              src="/resources/isotipo.png"
              alt=""
              width={60}
              height={60}
              className="hero-banner-isotipo"
            />
          </div>
          <p className="hero-banner-brand">ROMANY MELAN</p>
          <h1 id="hero-title" className="hero-banner-slogan">
            Joyería de Autor en <span className="hero-banner-accent">Micro-Macramé</span>
          </h1>
          <Link
            href="/coleccion/soberbia"
            className="hero-banner-cta"
            aria-label="Ver Colección Soberbia"
          >
            Colección Soberbia
          </Link>
        </div>
      </div>
    </section>
  );
}