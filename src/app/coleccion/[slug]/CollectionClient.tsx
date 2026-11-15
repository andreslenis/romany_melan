"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import ProductPrice from "@/components/product/ProductPrice";
import { usePerfil } from "@/context/ProfileContext";
import { altProducto } from "@/lib/seo";
import type { ProductoDB } from "@/lib/supabase/queries";
import type { Coleccion } from "@/lib/types";
import { precioFinal } from "@/utils/precio";

type Producto = ProductoDB;

type OrdenCatalogo = "destacado" | "precio-asc" | "precio-desc" | "alfabetico";

const BOTONES_ORDEN: { id: OrdenCatalogo; label: string }[] = [
  { id: "precio-asc", label: "Precio: menor a mayor" },
  { id: "precio-desc", label: "Precio: mayor a menor" },
  { id: "alfabetico", label: "Orden alfabético" },
];

/** Precio efectivo: promoción si está activa; si no, el precio regular. */
function precioEfectivo(p: Producto): number {
  return precioFinal({
    precio: Number(p.precio_cop ?? 0),
    precioPromo: p.precio_promo,
    promoActiva: p.promo_activa,
  });
}

interface CollectionClientProps {
  coleccion: Coleccion;
  productos: Producto[];
  slug: string;
}

export default function CollectionClient({
  coleccion,
  productos,
  slug,
}: CollectionClientProps) {
  const { perfil, hydrated } = usePerfil();
  const [linea, setLinea] = useState<"origen" | "singular">("origen");
  const [singularLocked, setSingularLocked] = useState(false);
  const [orden, setOrden] = useState<OrdenCatalogo>("destacado");

  const nombreColeccion = coleccion.nombre || slug;

  const norm = (l: string | number | boolean | null | undefined) => String(l).toLowerCase();
  const productosLinea = useMemo(() => {
    const filtrados = productos.filter((p) => norm(p.linea) === linea);
    if (orden === "precio-desc") {
      return [...filtrados].sort((a, b) => {
        const diff = precioEfectivo(b) - precioEfectivo(a);
        return diff !== 0 ? diff : a.nombre.localeCompare(b.nombre, "es");
      });
    }
    if (orden === "precio-asc") {
      return [...filtrados].sort((a, b) => {
        const diff = precioEfectivo(a) - precioEfectivo(b);
        return diff !== 0 ? diff : a.nombre.localeCompare(b.nombre, "es");
      });
    }
    if (orden === "alfabetico") {
      return [...filtrados].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    }
    return filtrados;
  }, [productos, linea, orden]);

  const handleSelectSingular = () => {
    if (!hydrated || !perfil) {
      setSingularLocked(true);
      return;
    }
    setSingularLocked(false);
    setLinea("singular");
  };

  if (singularLocked) {
    return (
      <>
        <SiteHeader />
        <main className="profile-page">
          <div className="container profile-gate">
            <span className="profile-gate-seal" aria-hidden="true">
              ✦
            </span>
            <h1 className="profile-title">Línea Singular</h1>
            <p className="profile-gate-text">
              La Línea Singular (Oro Macizo 18K) es privada para miembros del
              Círculo. Inicia sesión o crea tu perfil para acceder a ella.
            </p>
            <div className="profile-gate-actions">
              <Link href="/mi-perfil" className="cta-btn">
                Iniciar sesión
              </Link>
              <Link href="/crear-perfil" className="cta-btn">
                Crear perfil
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
      <main className="collection-page">
        <section className="collection-hero">
          <div className="container collection-hero-content">
            <h1 className="collection-hero-title" style={{ color: "#111111" }}>{(coleccion.nombre || slug).toUpperCase()}</h1>
            {coleccion.lema && <p className="collection-hero-subtitle">{coleccion.lema}</p>}
            {coleccion.descripcion_larga && <p className="collection-hero-text">{coleccion.descripcion_larga}</p>}
          </div>
        </section>

        <section className="line-selector">
          <div className="container line-selector-inner">
            <div className="line-tabs">
              <button className={`line-tab ${linea === "origen" ? "active" : ""}`} onClick={() => { setSingularLocked(false); setLinea("origen"); }}>Línea Origen</button>
              <button
                className={`line-tab ${linea === "singular" ? "active" : ""} ${!perfil ? "disabled" : ""}`}
                onClick={handleSelectSingular}
                disabled={!perfil}
              >
                Línea Singular
                <span className="line-tab-badge">
                  {!perfil
                    ? "Acceso Exclusivo para Miembros del Círculo"
                    : "Edición Limitada"}
                </span>
              </button>
            </div>
            <div className="catalog-order-bar" role="group" aria-label="Ordenar productos">
              {BOTONES_ORDEN.map((boton) => (
                <button
                  key={boton.id}
                  type="button"
                  className={`catalog-order-btn ${orden === boton.id ? "active" : ""}`}
                  aria-pressed={orden === boton.id}
                  onClick={() => setOrden(boton.id)}
                >
                  {boton.label}
                </button>
              ))}
              {orden !== "destacado" && (
                <button
                  type="button"
                  className="catalog-order-btn"
                  onClick={() => setOrden("destacado")}
                >
                  Restablecer
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="products-section">
          <div className="container">
            <div className={`products-grid ${productosLinea.length === 1 ? "products-grid--single" : ""}`}>
              {productosLinea.length === 0 ? (
                <p>No hay piezas disponibles en esta colección.</p>
              ) : (
                productosLinea.map((p) => {
                  const img = Array.isArray(p.imagenes) && p.imagenes.length ? p.imagenes[0] : "";
                  return (
                    <article key={p.slug || p.id} className="product-card">
                      <Link
                        className="product-card-media product-card-media--link"
                        href={`/producto/${p.slug}`}
                        aria-label={`Conoce la historia de ${p.nombre}`}
                      >
                        {img && (
                          <Image
                            src={img}
                            alt={altProducto({
                              nombre: p.nombre,
                              material: p.especificaciones?.material,
                              piedra: p.especificaciones?.piedra,
                              coleccion: nombreColeccion,
                            })}
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="33vw"
                          />
                        )}
                      </Link>
                      <div className="product-card-body">
                        <h3 className="product-card-title">{p.nombre}</h3>
                        {p.precio_cop ? (
                          <p className="product-card-price">
                            <ProductPrice
                              precio={Number(p.precio_cop)}
                              precioPromo={p.precio_promo}
                              promoActiva={p.promo_activa}
                            />
                          </p>
                        ) : null}
                        <Link className="product-card-btn" href={`/producto/${p.slug}`}>Conoce su Historia</Link>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}