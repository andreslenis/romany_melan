"use client";

import Link from "next/link";
import Image from "next/image";
import { usePerfil } from "@/context/ProfileContext";
import { useEffect, useState } from "react";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { supabase } from "@/lib/supabase/client";

export type ProductoSoberbia = {
  id: string;
  slug: string;
  nombre: string;
  linea: "origen" | "singular";
  precio_cop?: number;
  descripcion_corta?: string;
  historia_narrativa?: string;
  imagenes?: string[];
  especificaciones?: { material?: string; componentes?: string; piedra?: string };
  tallas?: unknown;
  colores_hilo?: unknown;
  activo?: boolean;
};

export default function SoberbiaClient() {
  const { perfil, hydrated } = usePerfil();

  useEffect(() => {
    if (!perfil) return;
    let timeout: NodeJS.Timeout;
    const reset = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = "/mi-perfil";
        }
      }, 15 * 60 * 1000);
    };
    const events = ["mousemove", "keydown", "click", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => {
      clearTimeout(timeout);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [perfil]);

  const [linea, setLinea] = useState<"origen" | "singular">("origen");
  const [singularLocked, setSingularLocked] = useState(false);
  const [productos, setProductos] = useState<ProductoSoberbia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const { data, error } = await supabase
          .from("productos")
          .select("*")
          .eq("activo", true)
          .order("nombre", { ascending: true });

        if (error) {
          console.error("Supabase error:", error);
          setProductos([]);
        } else {
          setProductos((data || []) as ProductoSoberbia[]);
        }
      } catch (e) {
        console.error(e);
        setProductos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  const productosLinea = productos.filter((p) => String(p.linea).toLowerCase() === linea);

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

      <main>
        <section className="collection-hero">
          <div className="container collection-hero-content">
            <div className="collection-hero-header">
              <h1 className="collection-hero-title">SOBERBIA</h1>
              <p className="collection-hero-subtitle">
                La elevación del ser y el brillo de la Amatista
              </p>
            </div>
            <p className="collection-hero-text">
              La Soberbia, aquí entendida como dignidad, es el reconocimiento
              sereno de la propia luz. No hay alarde, sino presencia. Como la
              amatista que nace entre vetas y se deja pulir en silencio, cada
              nudo de esta colección celebra la altura que habita en lo
              delicado. Tejer soberbia es recordar que elevarse también puede
              ser un acto de ternura.
            </p>
          </div>
        </section>

        <section className="line-selector">
          <div className="container line-selector-inner">
            <div className="line-tabs">
              <button
                className={`line-tab ${linea === "origen" ? "active" : ""}`}
                onClick={() => {
                  setSingularLocked(false);
                  setLinea("origen");
                }}
              >
                Línea Origen (Oro Laminado 18K)
              </button>
              <button
                className={`line-tab ${
                  linea === "singular" ? "active" : ""
                } ${!perfil ? "disabled" : ""}`}
                onClick={handleSelectSingular}
                disabled={!perfil}
              >
                Línea Singular (Oro Macizo 18K)
                <span className="line-tab-badge">
                  {!perfil
                    ? "Acceso Exclusivo para Miembros del Círculo"
                    : "Edición Limitada"}
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="products-section">
          <div className="container">
            <div className="products-grid">
              {loading ? (
                <div className="container">
                  <p className="profile-empty">Cargando colección…</p>
                </div>
              ) : productosLinea.length === 0 ? (
                <div className="container">
                  <p className="profile-empty">
                    No hay piezas disponibles en esta línea en este momento.
                  </p>
                </div>
              ) : (
                productosLinea.map((producto) => {
                  const primeraImagen =
                    Array.isArray(producto.imagenes) &&
                    producto.imagenes.length > 0
                      ? producto.imagenes[0]
                     : `/resources/colecciones/soberbia/origen/${producto.slug}/${producto.slug}_soberbia.jpg`;
                  return (
                    <article key={producto.slug} className="product-card">
                      <Link
                        className="product-card-media product-card-media--link"
                        href={`/producto/${producto.slug}`}
                        aria-label={`Conoce la historia de ${producto.nombre}`}
                      >
                        <Image
                          src={primeraImagen}
                          alt={producto.nombre}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <span className="product-card-cta">
                          Conoce su historia
                        </span>
                      </Link>
                      <div className="product-card-body">
                        <div className="product-card-info">
                          <h3 className="product-card-title">
                            {producto.nombre}
                          </h3>
                          <p className="product-card-badge">
                            {producto.linea === "origen"
                              ? "Oro Laminado 18K & Amatista Natural"
                              : "Oro Macizo 18K & Gema de Selección Especial"}
                          </p>
                          {linea === "origen" && producto.precio_cop && (
                            <p className="product-card-price">
                              ${producto.precio_cop.toLocaleString("es-CO")} COP
                            </p>
                          )}
                        </div>
                        <Link
                          className="product-card-btn"
                          href={`/producto/${producto.slug}`}
                        >
                          Conoce su Historia
                        </Link>
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
