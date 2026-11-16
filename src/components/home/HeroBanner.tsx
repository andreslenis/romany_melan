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
              src="/resources/logo.png"
              alt="Romany Melan"
              className="hero-banner-logo-img"
              width={320}
              height={180}
            />
          </div>
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