"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

import { useCart } from "@/context/CartContext";
import { usePerfil } from "@/context/ProfileContext";
import { lineasDe, productoPorSlug } from "@/data/productos";
import { COLORES_HILO, colorPorId } from "@/lib/pecados";
import { LINEAS_CORTAS, type Linea } from "@/lib/types";

export default function ProductoPDP({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { addItem } = useCart();
  const { perfil, solicitarEspera } = usePerfil();

  const productoBase = productoPorSlug(slug);
  const lineas = productoBase ? lineasDe(productoBase) : [];

  const [lineaActiva, setLineaActiva] = useState<Linea>(
    productoBase?.linea ?? "origen"
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [colorHilo, setColorHilo] = useState<string>("soberbia");
  const [observaciones, setObservaciones] = useState("");
  const [emailEspera, setEmailEspera] = useState("");
  const [esperaRegistrada, setEsperaRegistrada] = useState(false);

  const producto = lineas.find((l) => l.linea === lineaActiva) ?? productoBase;
  const slugActivo = producto?.slug;

  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const lastTapRef = useRef<number>(0);

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

  useEffect(() => {
    if (!slugActivo) return;
    const actual = productoPorSlug(slugActivo);
    if (!actual) return;
    setSelectedSize(actual.tallas.length ? String(actual.tallas[0]) : null);
    setColorHilo(actual.colorHilo ?? "soberbia");
    setObservaciones("");
  }, [slugActivo]);

  if (!producto) {
    return (
      <>
        <SiteHeader />
        <main className="pdp-not-found">
          <div className="container">
            <p>Producto no encontrado.</p>
            <Link href="/coleccion/soberbia" className="cta-btn">
              Volver a Soberbia
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const color = colorPorId(colorHilo);
  const esSingular = producto.linea === "singular";

  if (esSingular && !perfil) {
    return (
      <>
        <SiteHeader />
        <main className="pdp-not-found">
          <div className="container">
            <p>Esta línea solo está disponible para usuarios registrados e iniciados sesión.</p>
            <Link href="/mi-perfil" className="cta-btn">
              Ir a mi perfil
            </Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  /** Foto de la pieza en el hilo seleccionado. */
  const imagenPrincipal =
    (producto.imagenesPorColor?.[colorHilo] ?? producto.imagen) as string;

  /** Una miniatura por hilo disponible: al pulsarla se cambia el color. */
  const variantes = COLORES_HILO.map((opcion) => ({
    id: opcion.id,
    nombre: opcion.nombre,
    hex: opcion.hex,
    imagen: producto.imagenesPorColor?.[opcion.id],
  })).filter((variante) => Boolean(variante.imagen));

  const handleAddToCart = () => {
    addItem({
      slug: producto.slug,
      nombre: producto.nombre,
      linea: LINEAS_CORTAS[producto.linea],
      lineaId: producto.linea,
      precio: producto.precio,
      imagen: imagenPrincipal,
      talla: selectedSize,
      colorHilo: esSingular ? null : colorHilo,
      colorHiloHex: esSingular ? null : color?.hex ?? null,
      observaciones,
    });
  };

  const handleEspera = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = (emailEspera || perfil?.email || "").trim();
    if (!email) return;
    solicitarEspera({
      slug: producto.slug,
      nombre: producto.nombre,
      email,
      linea: producto.linea,
    });
    setEsperaRegistrada(true);
  };

  return (
    <>
      <SiteHeader />

      <main>
        <section className="pdp-section">
          <div className="container pdp-grid">
            <div className="pdp-gallery">
              <div className="pdp-gallery-main">
                <button
                  type="button"
                  className="pdp-gallery-image pdp-gallery-image--zoom"
                  onClick={() => {
                    setZoomScale(1);
                    setZoomOpen(true);
                  }}
                  onTouchEnd={(e) => {
                    const now = Date.now();
                    if (now - lastTapRef.current < 300) {
                      e.preventDefault();
                      setZoomScale(1);
                      setZoomOpen(true);
                    }
                    lastTapRef.current = now;
                  }}
                  aria-label="Ampliar imagen"
                >
                  <Image
                    src={imagenPrincipal}
                    alt={`${producto.nombre} · Hilo ${color?.nombre ?? ""}`}
                    fill
                    priority
                    unoptimized={producto.imagenSinOptimizar}
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 968px) 100vw, 50vw"
                  />
                </button>
              </div>
              {variantes.length > 0 && (
                <div className="pdp-gallery-thumbs">
                  {variantes.map((variante) => (
                    <button
                      key={variante.id}
                      type="button"
                      className={`pdp-thumb ${
                        variante.id === colorHilo ? "active" : ""
                      }`}
                      aria-label={`Ver ${producto.nombre} en hilo ${variante.nombre}`}
                      aria-pressed={variante.id === colorHilo}
                      onClick={() => setColorHilo(variante.id)}
                    >
                      <div className="pdp-thumb-image">
                        <Image
                          src={variante.imagen as string}
                          alt={`${producto.nombre} en hilo ${variante.nombre}`}
                          fill
                          unoptimized={producto.imagenSinOptimizar}
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pdp-info">
              <div className="pdp-header">
                <h1 className="pdp-title">{producto.nombre}</h1>
                <p className="pdp-line">{producto.material}</p>
                <p className="pdp-price">{producto.precioFormato}</p>
              </div>

              {lineas.length > 1 && (
                <div className="pdp-line-selector">
                  <h3 className="pdp-block-title">Elige tu línea</h3>
                  <div className="pdp-line-tabs" role="tablist">
                    {lineas.map((linea) => (
                      <button
                        key={linea.slug}
                        role="tab"
                        aria-selected={linea.linea === lineaActiva}
                        className={`pdp-line-tab ${
                          linea.linea === lineaActiva ? "active" : ""
                        }`}
                        onClick={() => setLineaActiva(linea.linea)}
                      >
                        <span className="pdp-line-tab-name">
                          {LINEAS_CORTAS[linea.linea]}
                        </span>
                        <span className="pdp-line-tab-material">
                          {linea.material}
                        </span>
                        <span className="pdp-line-tab-price">
                          {linea.precioFormato}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pdp-badge-block">
                <span className="pdp-badge">{producto.badge}</span>
                {producto.insignia && (
                  <span className="pdp-badge pdp-badge--exclusiva">
                    {producto.insignia}
                  </span>
                )}
              </div>

              {esSingular ? (
                <div className="pdp-color-fijo">
                  <h3 className="pdp-block-title">Color del hilo</h3>
                  <p className="pdp-color-fijo-text">
                    <span
                      className="color-swatch color-swatch--static"
                      style={{ backgroundColor: color?.hex }}
                      aria-hidden="true"
                    />
                    {color?.nombre} · Fijo según el diseño de la autora
                  </p>
                </div>
              ) : (
                <div className="pdp-color-block">
                  <h3 className="pdp-block-title">Color del hilo</h3>
                  <p className="pdp-color-intro">
                    Cada hilo toma el color de un pecado, o los tonos neutros
                    Oscuridad y Luz. Elige el que te acompaña.
                  </p>
                  <div className="color-swatches">
                    {COLORES_HILO.map((opcion) => (
                      <button
                        key={opcion.id}
                        type="button"
                        className={`color-swatch ${
                          colorHilo === opcion.id ? "active" : ""
                        }`}
                        style={{ backgroundColor: opcion.hex }}
                        title={`${opcion.nombre} · ${opcion.pecado}`}
                        aria-label={`Hilo ${opcion.nombre}, color de ${opcion.pecado}`}
                        aria-pressed={colorHilo === opcion.id}
                        onClick={() => setColorHilo(opcion.id)}
                      />
                    ))}
                  </div>
                  <p className="color-selected">
                    Hilo {color?.nombre} · {color?.pecado}
                  </p>
                </div>
              )}

              {producto.tallas.length > 0 && (
                <div className="pdp-size-block">
                  <h3 className="pdp-block-title">Talla</h3>
                  <div className="pdp-size-options">
                    {producto.tallas.map((t: string | number) => (
                      <button
                        key={String(t)}
                        className={`pdp-size-btn ${
                          selectedSize === String(t) ? "active" : ""
                        }`}
                        onClick={() => setSelectedSize(String(t))}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pdp-observaciones">
                <h3 className="pdp-block-title">Observaciones de la pieza</h3>
                <p className="pdp-color-intro">
                  ¿Necesitas una talla diferente o un ajuste especial? Cuéntanoslo
                  y lo realizamos a tus necesidades.
                </p>
                <textarea
                  className="form-input form-textarea"
                  rows={3}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: talla 5 1/2, empaque para regalo,...."
                />
              </div>

              <div className="pdp-actions">
                {producto.modoAcceso === "disponible" ? (
                  <button className="pdp-add-btn" onClick={handleAddToCart}>
                    Tejer esta Historia en mi Piel
                  </button>
                ) : producto.modoAcceso === "circulo" ? (
                  <>
                    <Link
                      className="pdp-add-btn pdp-add-btn--outline"
                      href="/mi-perfil"
                    >
                      Solicitar Acceso al Círculo
                    </Link>
                    <p className="pdp-access-note">
                      Esta obra no está en stock abierto. Crea tu perfil en el
                      Círculo para solicitar el acceso y ser notificado cuando
                      haya una edición disponible.
                    </p>
                  </>
                ) : esperaRegistrada ? (
                  <p className="pdp-waitlist-done">
                    Te anotamos en la lista de espera de{" "}
                    <strong>{producto.nombre}</strong>. Te avisaremos por correo
                    cuando abramos la próxima edición.
                  </p>
                ) : (
                  <form className="pdp-waitlist" onSubmit={handleEspera}>
                    <label className="form-field">
                      <span className="form-label">
                        Correo para la lista de espera
                      </span>
                      <input
                        className="form-input"
                        type="email"
                        value={emailEspera}
                        onChange={(e) => setEmailEspera(e.target.value)}
                        placeholder="tu@email.com"
                        required
                      />
                    </label>
                    <button type="submit" className="pdp-add-btn">
                      Unirme a la Lista de Espera
                    </button>
                    <p className="pdp-access-note">
                      Obra invariable de edición limitada. Guardamos tu lugar en
                      la fila y te escribimos en cuanto haya una unidad.
                    </p>
                  </form>
                )}
              </div>

              <details className="pdp-specs">
                <summary>Especificaciones técnicas</summary>
                <div className="pdp-specs-content">
                  <ul>
                    <li>
                      <strong>Material:</strong> {producto.especificaciones.material}
                    </li>
                    <li>
                      <strong>Componentes metálicos:</strong>{" "}
                      {producto.especificaciones.componentes}
                    </li>
                    <li>
                      <strong>Piedra:</strong> {producto.especificaciones.piedra}
                    </li>
                  </ul>
                </div>
              </details>

              <div className="pdp-narrative">
                <h3 className="pdp-block-title">La Historia detrás de esta pieza</h3>
                <p>{producto.narrativa}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      {zoomOpen && (
        <div className="zoom-overlay" role="dialog" aria-modal="true" onClick={() => setZoomOpen(false)}>
          <button
            type="button"
            className="zoom-close"
            aria-label="Cerrar vista ampliada"
            onClick={(e) => {
              e.stopPropagation();
              setZoomOpen(false);
            }}
          >
            ×
          </button>
          <div className="zoom-content" onClick={(e) => e.stopPropagation()}>
            <div
              className="zoom-img-wrap"
              onWheel={(e) => {
                e.preventDefault();
                setZoomScale((s) => {
                  const delta = e.deltaY > 0 ? -0.15 : 0.15;
                  return Math.min(Math.max(s + delta, 1), 5);
                });
              }}
              onClick={() => setZoomScale((s) => (s >= 2 ? 1 : 2.5))}
            >
              <div
                className="zoom-img"
                style={{ transform: `scale(${zoomScale})` }}
              >
                <Image
                  src={imagenPrincipal}
                  alt={`${producto.nombre} · Hilo ${color?.nombre ?? ""}`}
                  width={800}
                  height={1000}
                  unoptimized={producto.imagenSinOptimizar}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                  sizes="100vw"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
