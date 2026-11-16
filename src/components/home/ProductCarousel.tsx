"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatCOP } from "@/utils/format";
import { precioFinal, promoVigente } from "@/utils/precio";
import { useCart } from "@/context/CartContext";
import type { ProductoDB } from "@/lib/supabase/queries";

interface ProductCarouselProps {
  productos: ProductoDB[];
}

export default function ProductCarousel({ productos }: ProductCarouselProps) {
  const { addItem, open } = useCart();
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const itemsPerView = typeof window !== "undefined" && window.innerWidth >= 1024 ? 4 : 
                       typeof window !== "undefined" && window.innerWidth >= 768 ? 3 : 1;
  const maxIndex = Math.max(0, productos.length - itemsPerView);

  useEffect(() => {
    const handleResize = () => {
      const newItemsPerView = window.innerWidth >= 1024 ? 4 : window.innerWidth >= 768 ? 3 : 1;
      setCurrentIndex(prev => Math.min(prev, Math.max(0, productos.length - newItemsPerView)));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [productos.length]);

  const scrollToIndex = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, maxIndex));
    setCurrentIndex(clampedIndex);
    carouselRef.current?.scrollTo({
      left: carouselRef.current.scrollWidth * (clampedIndex / maxIndex) || 0,
      behavior: "smooth",
    });
  }, [maxIndex]);

  const handlePrev = () => scrollToIndex(currentIndex - 1);
  const handleNext = () => scrollToIndex(currentIndex + 1);

  const getItemWidth = () => {
    if (productos.length === 0) return "100%";
    if (typeof window === "undefined") return "25%";
    if (window.innerWidth >= 1024) return "25%";
    if (window.innerWidth >= 768) return "33.33%";
    return "100%";
  };

  const handleAddToCart = (producto: ProductoDB) => {
    const precioBase = Number(producto.precio_cop ?? 0);
    const precioCobrado = precioFinal({
      precio: precioBase,
      precioPromo: producto.precio_promo,
      promoActiva: producto.promo_activa,
    });
    const imagen = (Array.isArray(producto.imagenes) && producto.imagenes[0]) || producto.imagen || "";

    addItem({
      slug: producto.slug,
      nombre: producto.nombre,
      linea: String(producto.linea || "").toLowerCase() === "singular" ? "singular" : "origen",
      lineaId: String(producto.linea || "").toLowerCase() === "singular" ? "singular" : "origen",
      precio: precioCobrado,
      imagen,
      talla: null,
      colorHilo: null,
      colorHiloHex: null,
      observaciones: "",
      coleccion: null,
    });
    open();
  };

  if (productos.length === 0) return null;

  return (
    <section className="products-carousel-section" aria-label="Productos destacados">
      <div className="container">
        <header className="carousel-header">
          <h2 className="carousel-title">Destacados</h2>
          <p className="carousel-subtitle">Nuestras piezas más deseadas</p>
        </header>

        <div className="carousel-wrapper">
          <button
            className="carousel-btn carousel-btn--prev"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="Productos anteriores"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <div
            ref={carouselRef}
            className="carousel-track"
            role="list"
            style={{ scrollSnapType: "x mandatory", display: "flex", gap: "1.5rem", overflowX: "auto", scrollBehavior: "smooth", paddingBottom: "1rem", scrollPadding: "0 1.5rem" }}
          >
            {productos.map((producto) => {
              const precioBase = Number(producto.precio_cop ?? 0);
              const tienePromo = promoVigente({ precio: precioBase, precioPromo: producto.precio_promo, promoActiva: producto.promo_activa });
              const precioCobrado = precioFinal({ precio: precioBase, precioPromo: producto.precio_promo, promoActiva: producto.promo_activa });
              const imagen = (Array.isArray(producto.imagenes) && producto.imagenes[0]) || producto.imagen;

              return (
                <article
                  key={producto.id}
                  className="carousel-card"
                  role="listitem"
                  style={{
                    flex: `0 0 ${getItemWidth()}`,
                    minWidth: "260px",
                    scrollSnapAlign: "start",
                  }}
                >
                  <Link href={`/producto/${producto.slug}`} className="carousel-card-link">
                    <div className="carousel-card-media">
                      {imagen ? (
                        <Image
                          src={imagen}
                          alt={producto.nombre}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 25vw"
                          className="carousel-card-image"
                        />
                      ) : (
                        <div className="carousel-card-placeholder" />
                      )}
                    </div>
                    <div className="carousel-card-content">
                      <h3 className="carousel-card-title">{producto.nombre}</h3>
                      <div className="carousel-card-price">
                        <span className="price-current">{formatCOP(precioCobrado)}</span>
                        {tienePromo && (
                          <span className="price-old">{formatCOP(precioBase)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <button
                    className="carousel-card-btn"
                    onClick={() => handleAddToCart(producto)}
                    aria-label={`Agregar ${producto.nombre} al carrito`}
                  >
                    Agregar al carrito
                  </button>
                </article>
              );
            })}
          </div>

          <button
            className="carousel-btn carousel-btn--next"
            onClick={handleNext}
            disabled={currentIndex >= maxIndex}
            aria-label="Siguientes productos"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        {productos.length > itemsPerView && (
          <div className="carousel-dots" role="tablist" aria-label="Navegación del carrusel">
            {Array.from({ length: maxIndex + 1 }, (_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === currentIndex}
                aria-label={`Ver grupo ${i + 1}`}
                className={`carousel-dot ${i === currentIndex ? "active" : ""}`}
                onClick={() => scrollToIndex(i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}