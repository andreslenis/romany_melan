"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Coleccion } from "@/lib/types";

interface CollectionBannerCarouselProps {
  colecciones: Coleccion[];
}

const AUTOPLAY_MS = 6000;

export default function CollectionBannerCarousel({ colecciones }: CollectionBannerCarouselProps) {
  const slides = colecciones.filter(
    (c) =>
      c.modo_acceso === "activa" &&
      c.banner_activo &&
      Boolean(c.banner_foto_url || c.foto_url)
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || paused || reducedMotion) return;
    const id = window.setInterval(() => {
      setCurrentIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [slides.length, paused, reducedMotion]);

  const goTo = useCallback(
    (index: number) => {
      if (slides.length === 0) return;
      setCurrentIndex(((index % slides.length) + slides.length) % slides.length);
    },
    [slides.length]
  );

  const handlePrev = () => goTo(currentIndex - 1);
  const handleNext = () => goTo(currentIndex + 1);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) handleNext();
    else handlePrev();
  };

  if (slides.length === 0) return null;

  return (
    <section
      className="banner-carousel"
      aria-label="Colecciones destacadas"
      aria-roledescription="carrusel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {slides.map((c, index) => {
        const foto = c.banner_foto_url || c.foto_url || "";
        const active = index === currentIndex;
        return (
          <div
            key={c.id}
            className={`banner-slide${active ? " banner-slide--active" : ""}`}
            aria-hidden={!active}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} de ${slides.length}: ${c.nombre}`}
          >
            <div className="banner-bg">
              <Image
                src={foto}
                alt=""
                fill
                priority={index === 0}
                sizes="100vw"
                className="banner-image"
              />
              <div className="banner-overlay" aria-hidden="true" />
            </div>
            <div className="container banner-content">
              <div className="banner-text">
                <div className="banner-logo" aria-hidden="true">
                  <Image
                    src="/resources/logo.png"
                    alt="Romany Melan"
                    className="banner-logo-img"
                    width={320}
                    height={180}
                  />
                </div>
                <h2 className="banner-title">{c.nombre}</h2>
                {c.lema && <p className="banner-subtitle">{c.lema}</p>}
                <Link
                  href={`/coleccion/${c.slug}`}
                  className="hero-banner-cta banner-cta"
                  tabIndex={active ? 0 : -1}
                >
                  {c.texto_boton || "Ver Colección"}
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {slides.length > 1 && (
        <>
          <button
            className="banner-arrow banner-arrow--prev"
            onClick={handlePrev}
            aria-label="Colección anterior"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button
            className="banner-arrow banner-arrow--next"
            onClick={handleNext}
            aria-label="Siguiente colección"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          <div className="banner-dots" role="tablist" aria-label="Navegación de banners">
            {slides.map((c, i) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={i === currentIndex}
                aria-label={`Ir a ${c.nombre}`}
                className={`banner-dot${i === currentIndex ? " active" : ""}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}