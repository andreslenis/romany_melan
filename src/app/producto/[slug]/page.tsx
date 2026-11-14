"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

import { useCart } from "@/context/CartContext";
import { usePerfil } from "@/context/ProfileContext";

import { supabase } from "@/lib/supabase/client";
import { COLORES_HILO, colorPorId } from "@/lib/pecados";
import { LINEAS_CORTAS, type Linea } from "@/lib/types";
import { precioFinal, precioRegular, promoVigente } from "@/utils/precio";

const SHARE_URL_BASE = typeof window !== "undefined" ? window.location.origin : "https://www.romanymelan.com";

export default function ProductoPDP({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { addItem } = useCart();
  const { perfil, solicitarEspera } = usePerfil();

  type DBProd = {
    id: string; slug: string; nombre: string; linea: string; precio?: number; precio_cop?: number; precioFormato?: string;
    precio_promo?: number | null; promo_activa?: boolean | null;
    material?: string; categoria?: string; badge?: string; narrativa?: string; descripcion_corta?: string; historia_narrativa?: string;
    especificaciones?: { material?: string; componentes?: string; piedra?: string };
    tallas?: (string | number)[];
    imagen?: string; imagenes?: string[]; colorHilo?: string; colores_hilo?: string[] | string; modoAcceso?: string; insignia?: string;
    grupo?: string; coleccion_id?: string; imagenes_por_color?: Record<string, string>; imagenesPorColor?: Record<string, string>;
  };

  const [productoBase, setProductoBase] = useState<DBProd | null>(null);
  const [variantes, setVariantes] = useState<DBProd[]>([]);
  const [coleccionNombre, setColeccionNombre] = useState<string | null>(null);
  const [lineaActiva, setLineaActiva] = useState<Linea>("origen");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [colorHilo, setColorHilo] = useState<string | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [emailEspera, setEmailEspera] = useState("");
  const [esperaRegistrada, setEsperaRegistrada] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const getImgsPorColor = (p: DBProd | null): Record<string, string> => {
    if (!p) return {};
    const source = p.imagenesPorColor && typeof p.imagenesPorColor === "object" ? p.imagenesPorColor : p.imagenes_por_color;
    if (!source || typeof source !== "object" || Array.isArray(source)) return {};
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
      if (typeof key === "string" && typeof value === "string" && value.trim().length > 0) {
        out[key.trim()] = value;
      }
    }
    return out;
  };

  const parseColoresHilo = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.filter((c): c is string => typeof c === "string" && c.trim().length > 0).map((c) => c.trim());
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const raw = value.trim();
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((c): c is string => typeof c === "string" && c.trim().length > 0).map((c) => c.trim());
        }
      } catch {
        // not JSON
      }
      return raw.split(",").map((c) => c.trim()).filter(Boolean);
    }
    return [];
  };

  const colorIdsValidos = new Set(COLORES_HILO.map((c) => c.id));

  const coloresConFoto = (p: DBProd | null): string[] => {
    if (!p) return [];
    const seleccionados = parseColoresHilo(p.colores_hilo).filter((id) => colorIdsValidos.has(id));
    if (seleccionados.length === 0) return [];
    const imgs = getImgsPorColor(p);
    return seleccionados.filter((id) => typeof imgs[id] === "string" && imgs[id].length > 0);
  };

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase.from("productos").select("*").eq("slug", slug).maybeSingle();
      if (!p) { setProductoBase(null); setVariantes([]); setColorHilo(null); return; }
      const prod = p as DBProd;
      setProductoBase(prod);
      if (prod.coleccion_id) {
        const { data: col } = await supabase.from("colecciones").select("nombre").eq("id", prod.coleccion_id).maybeSingle();
        if (col && typeof col === "object" && "nombre" in col) setColeccionNombre(String(col.nombre));
      }
      const prodLinea = String(prod.linea || "").toLowerCase() === "singular" ? "singular" : "origen";
      setLineaActiva(prodLinea);
      // Sin preselección: el cliente debe elegir talla explícitamente.
      setSelectedSize(null);
      if (prod.grupo) {
        const { data: vs } = await supabase.from("productos").select("*").eq("grupo", prod.grupo);
        setVariantes((vs || []) as DBProd[]);
      } else {
        setVariantes([prod]);
      }
    };
    load();
  }, [slug]);

  const varianteActual = (() => {
    if (!colorHilo) return productoBase;
    const lineaActivaNorm = lineaActiva;
    const byColorInLinea = variantes.find((v) => {
      const vLinea = String(v.linea || "").toLowerCase() === "singular" ? "singular" : "origen";
      const cs = parseColoresHilo(v.colores_hilo);
      return vLinea === lineaActivaNorm && cs.includes(colorHilo);
    });
    if (byColorInLinea) return byColorInLinea;
    const byColorAny = variantes.find((v) => {
      const cs = parseColoresHilo(v.colores_hilo);
      return cs.includes(colorHilo);
    });
    if (byColorAny) return byColorAny;
    return productoBase;
  })();
  const producto = varianteActual || productoBase;
  const slugActivo = producto?.slug;
  const lineaNormProducto = String(producto?.linea || "").toLowerCase() === "singular" ? "singular" : "origen";
  const esSingular = lineaNormProducto === "singular";

  const shareUrl = `${SHARE_URL_BASE}/producto/${slugActivo}`;

  const handleShareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const handleShareCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const coloresDisponibles = (() => {
    if (!producto || esSingular) return [];
    const ids = new Set<string>();
    [producto, ...variantes].forEach((v) => {
      if (!v) return;
      const vLinea = String(v.linea || "").toLowerCase() === "singular" ? "singular" : "origen";
      if (vLinea !== lineaNormProducto) return;
      coloresConFoto(v).forEach((id) => ids.add(id));
    });
    return COLORES_HILO.filter((c) => ids.has(c.id));
  })();
  const coloresDisponiblesKey = coloresDisponibles.map((c) => c.id).join("|");

  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [slugActivo, colorHilo]);

  // Al cambiar de variante (color) las tallas pueden cambiar: reiniciar la selección.
  useEffect(() => {
    setSelectedSize(null);
  }, [slugActivo]);

  useEffect(() => {
    if (!productoBase) return;
    if (esSingular) {
      setColorHilo(null);
      return;
    }
    if (coloresDisponibles.length === 0) {
      setColorHilo(null);
      return;
    }
    setColorHilo((prev) => (prev && coloresDisponibles.some((c) => c.id === prev) ? prev : coloresDisponibles[0].id));
  }, [productoBase, esSingular, coloresDisponiblesKey]);

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

  const color = colorHilo ? colorPorId(colorHilo) : undefined;
  const descripcionCorta = String((producto as unknown as Record<string, unknown>).descripcion_corta || "").trim();
  const historia = String(
    (producto as unknown as Record<string, unknown>).historia_narrativa ||
      (producto as unknown as Record<string, unknown>).narrativa ||
      ""
  ).trim();

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

  const imagenPrincipalVar = (Array.isArray(producto.imagenes) && producto.imagenes.length ? producto.imagenes[0] : producto.imagen) as string | undefined;

  const imgsPorColor = getImgsPorColor(producto);
  const colorActivoValido = !esSingular && colorHilo && typeof imgsPorColor[colorHilo] === "string" && imgsPorColor[colorHilo].length > 0 ? colorHilo : null;

  const allImages = (() => {
    if (colorActivoValido) {
      const colorImg = imgsPorColor[colorActivoValido];
      const base = Array.isArray(producto.imagenes) && producto.imagenes.length > 0
        ? [colorImg, ...producto.imagenes.filter((img: string) => img !== colorImg)]
        : [colorImg];
      return base.filter(Boolean);
    }
    if (Array.isArray(producto.imagenes) && producto.imagenes.length > 0) {
      return imagenPrincipalVar
        ? [imagenPrincipalVar, ...producto.imagenes.filter((img: string) => img !== imagenPrincipalVar)]
        : [...producto.imagenes];
    }
    return imagenPrincipalVar ? [imagenPrincipalVar] : [];
  })();

  const imagenParaCarrito = (colorActivoValido && imgsPorColor[colorActivoValido]) || imagenPrincipalVar || allImages[0] || "";
  const precioBase = Number(producto.precio_cop ?? 0);
  const tienePromo = promoVigente({ precio: precioBase, precioPromo: producto.precio_promo, promoActiva: producto.promo_activa });
  const precioCobrado = precioFinal({ precio: precioBase, precioPromo: producto.precio_promo, promoActiva: producto.promo_activa });
  const precioFormato = producto.precioFormato || (precioCobrado ? `$${precioCobrado.toLocaleString("es-CO")} COP` : "");
  const precioRegularFormato = `$${precioRegular({ precio: precioBase }).toLocaleString("es-CO")} COP`;

  const requiereTalla = Array.isArray(producto.tallas) && producto.tallas.length > 0;
  const puedeAgregar = !requiereTalla || Boolean(selectedSize);

  const handleAddToCart = () => {
    if (!puedeAgregar) return;
    addItem({
      slug: producto.slug,
      nombre: producto.nombre,
      linea: LINEAS_CORTAS[lineaNormProducto as Linea],
      lineaId: lineaNormProducto as Linea,
      precio: precioCobrado,
      imagen: imagenParaCarrito,
      talla: selectedSize,
      colorHilo: esSingular ? null : colorActivoValido,
      colorHiloHex: esSingular ? null : (colorActivoValido ? colorPorId(colorActivoValido)?.hex ?? null : null),
      observaciones,
      coleccion: coleccionNombre,
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
        linea: lineaNormProducto as Linea,
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
              <div className="pdp-gallery-main" style={{ position: "relative" }}>
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
                    src={allImages[currentImageIndex] || imagenParaCarrito}
                    alt={color ? `${producto.nombre} · Hilo ${color.nombre}` : producto.nombre}
                    unoptimized
                    fill
                    priority

                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 968px) 100vw, 50vw"
                  />
                </button>
                {allImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
                      }}
                      style={{
                        position: "absolute",
                        left: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "2.5rem",
                        height: "2.5rem",
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.9)",
                        border: "1px solid rgba(0,0,0,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2,
                        cursor: "pointer",
                      }}
                      aria-label="Imagen anterior"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
                      }}
                      style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "2.5rem",
                        height: "2.5rem",
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.9)",
                        border: "1px solid rgba(0,0,0,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2,
                        cursor: "pointer",
                      }}
                      aria-label="Imagen siguiente"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="pdp-gallery-thumbs">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`pdp-thumb ${idx === currentImageIndex ? "active" : ""}`}
                      aria-label={`Ver imagen ${idx + 1}`}
                      aria-pressed={idx === currentImageIndex}
                      onClick={() => setCurrentImageIndex(idx)}
                    >
                      <div className="pdp-thumb-image">
                        <Image
                          src={img}
                          alt={`${producto.nombre} imagen ${idx + 1}`}
                          fill
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
                <p className="pdp-price">{precioFormato}</p>
                {tienePromo && (
                  <p className="pdp-price-old">{precioRegularFormato}</p>
                )}
                {descripcionCorta && (
                  <div className="pdp-accordion">
                    <div className="pdp-accordion-item">
                      <details>
                        <summary>Descripción</summary>
                        <div className="pdp-accordion-content">
                          <p>{descripcionCorta}</p>
                        </div>
                      </details>
                    </div>
                  </div>
                )}
                {historia && (
                  <div className="pdp-accordion pdp-accordion--header">
                    <div className="pdp-accordion-item">
                      <details>
                        <summary>NARRATIVA / HISTORIA</summary>
                        <div className="pdp-accordion-content">
                          <p>{historia}</p>
                        </div>
                      </details>
                    </div>
                  </div>
                )}
                <details className="pdp-specs">
                  <summary>Especificaciones técnicas</summary>
                  <div className="pdp-specs-content">
                    <ul>
                      <li>
                        <strong>Material:</strong> {producto.especificaciones?.material}
                      </li>
                      <li>
                        <strong>Componentes metálicos:</strong> {producto.especificaciones?.componentes}
                      </li>
                      <li>
                        <strong>Piedra:</strong> {producto.especificaciones?.piedra}
                      </li>
                    </ul>
                  </div>
                </details>
                <p className="pdp-line">{producto.material}</p>
              </div>

               {variantes.length > 1 && false && (
                <div className="pdp-line-selector">
                  <h3 className="pdp-block-title">Elige tu línea</h3>
                  <div className="pdp-line-tabs" role="tablist">
                    {variantes.map((linea) => (
                      <button
                        key={linea.slug}
                        role="tab"
                        aria-selected={linea.linea === lineaActiva}
                        className={`pdp-line-tab ${linea.linea === lineaActiva ? "active" : ""}`}
                        onClick={() => setLineaActiva(linea.linea as Linea)}
                      >
                        <span className="pdp-line-tab-name">{LINEAS_CORTAS[linea.linea as Linea]}</span>
                        <span className="pdp-line-tab-material">{linea.material}</span>
                        {perfil && <span className="pdp-line-tab-price">{linea.precioFormato}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

               {esSingular ? (
                color ? (
                  <div className="pdp-color-fijo">
                    <h3 className="pdp-block-title">Color del hilo</h3>
                    <p className="pdp-color-fijo-text">
                      <span className="color-swatch color-swatch--static" style={{ backgroundColor: color.hex }} aria-hidden="true" />
                      {color.nombre} · Fijo según el diseño de la autora
                    </p>
                  </div>
                ) : null
              ) : coloresDisponibles.length > 0 ? (
                <div className="pdp-color-block">
                  <h3 className="pdp-block-title">Color del hilo</h3>
                  <p className="pdp-color-intro">Cada hilo toma el color de un pecado, o los tonos neutros Oscuridad y Luz. Elige el que te acompaña.</p>
                  <div className="color-swatches">
                    {coloresDisponibles.map((opcion) => (
                      <button
                        key={opcion.id}
                        type="button"
                        className={`color-swatch ${colorHilo === opcion.id ? "active" : ""}`}
                        style={{ backgroundColor: opcion.hex }}
                        title={`${opcion.nombre} · ${opcion.pecado}`}
                        aria-label={`Hilo ${opcion.nombre}, color de ${opcion.pecado}`}
                        aria-pressed={colorHilo === opcion.id}
                        onClick={() => setColorHilo(opcion.id)}
                      />
                    ))}
                  </div>
                  {color && <p className="color-selected">Hilo {color.nombre} · {color.pecado}</p>}
                </div>
              ) : null}

               {Array.isArray(producto.tallas) && producto.tallas.length > 0 && (
                <div className="pdp-size-block">
                  <h3 className="pdp-block-title">Talla</h3>
                  <div className="pdp-size-options">
                    <select
                      className="pdp-size-select"
                      value={selectedSize || ""}
                      onChange={(e) => setSelectedSize(e.target.value || null)}
                    >
                      <option value="">Seleccione talla</option>
                      {producto.tallas.map((t: string | number) => (
                        <option key={String(t)} value={String(t)}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="pdp-observaciones">
                <h3 className="pdp-block-title" style={{ fontWeight: 600 }}>Observaciones de la pieza</h3>
                <p className="pdp-color-intro">¿Necesitas una talla diferente o un ajuste especial? Cuéntanoslo y lo realizamos a tus necesidades.</p>
                <textarea
                  className="form-input form-textarea"
                  rows={3}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ej: talla 5 1/2, empaque para regalo,..."
                />
              </div>

                <div className="pdp-actions">
                  {producto.modoAcceso === "disponible" ? (
                    <>
                      <button className="pdp-add-btn" onClick={handleAddToCart} disabled={!puedeAgregar}>
                        Tejer esta Historia en mi Piel
                      </button>
                      {requiereTalla && !selectedSize && (
                        <p className="pdp-size-hint">Selecciona una talla para continuar.</p>
                      )}
                    </>
                  ) : producto.modoAcceso === "circulo" ? (
                    <>
                      <Link className="pdp-add-btn pdp-add-btn--outline" href="/mi-perfil">
                        Solicitar Acceso al Círculo
                      </Link>
                      <p className="pdp-access-note">Esta obra no está en stock abierto. Crea tu perfil en el Círculo para solicitar el acceso y ser notificado cuando haya una edición disponible.</p>
                    </>
                  ) : !esSingular ? (
                    <>
                      <button className="pdp-add-btn" onClick={handleAddToCart} disabled={!puedeAgregar}>
                        Tejer esta Historia en mi Piel
                      </button>
                      {requiereTalla && !selectedSize && (
                        <p className="pdp-size-hint">Selecciona una talla para continuar.</p>
                      )}
                    </>
                  ) : esperaRegistrada ? (
                    <p className="pdp-waitlist-done">
                      Te anotamos en la lista de espera de <strong>{producto.nombre}</strong>. Te avisaremos por correo cuando abramos la próxima edición.
                    </p>
                  ) : (
                    <form className="pdp-waitlist" onSubmit={handleEspera}>
                      <label className="form-field">
                        <span className="form-label">Correo para la lista de espera</span>
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
                      <p className="pdp-access-note">Obra invariable de edición limitada. Guardamos tu lugar en la fila y te escribemos en cuanto haya una unidad.</p>
                    </form>
                  )}
                </div>

                <div className="pdp-share" style={{ marginTop: "1.5rem" }}>
                    <p className="pdp-share-note">Comparte este articulo con quien desees</p>
                    <button
                      type="button"
                      className="pdp-share-btn pdp-share-btn--whatsapp"
                      onClick={handleShareWhatsApp}
                      aria-label="Compartir por WhatsApp"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3.5A14 14 0 0 1 21 12c0 4.7-2.8 8.8-6.9 10.4-.5.2-1 .1-1.3-.3a12 12 0 0 1-22-13.7c.2-.5.7-1 1.2-1.3A14 14 0 0 1 17.5 3.5z" /><path d="M12 9v4l2.5 2" /></svg>
                      <span>WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      className="pdp-share-btn pdp-share-btn--copy"
                      onClick={handleShareCopy}
                      aria-label="Copiar enlace del producto"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                      <span>{shareCopied ? "¡Copiado!" : "Copiar enlace"}</span>
                    </button>
                  </div>

              <div className="pdp-accordion">
                <div className="pdp-accordion-item">
                  <details>
                    <summary>CUIDA DE TUS JOYAS</summary>
                    <div className="pdp-accordion-content">
                      <p>Desde Romany Melan te aconsejamos que hagas un uso adecuado de tus joyas. Son productos que aunque sean duraderos han de ser almacenados de forma independiente evitando el roce y a ser posible en bolsas individuales. No uses productos abrasivos para su limpieza. Recuerda tratarlas con cariño y mimo.</p>
                    </div>
                  </details>
                </div>
                <div className="pdp-accordion-item">
                  <details>
                    <summary>COMO MEDIR TU MUÑECA</summary>
                    <div className="pdp-accordion-content">
                      <p>Paso 1- Envuelve tu muñeca con una cinta por la parte más estrecha.</p>
                      <p>Paso 2- Coloca la cinta sobre la mesa y mídela con una regla.</p>
                      <p>Paso 3- Una véz sepas que medida tienes ya puedes escoger la medida que más te convenga de las medidas que te proponemos, siempre aproximándote al máximo a tu medida. Ten en cuenta si te gustan más bien ajustadas, un poco sueltas, o muy sueltas. Depende del modelo de pulsera es más conveniente escoger una opción u otra.</p>
                      <div className="pdp-accordion-images">
                        <Image src="/resources/como_medir/paso_1_mano.jpg" alt="Paso 1 para medir muñeca" width={400} height={400} />
                        <Image src="/resources/como_medir/paso_2_mano.jpg" alt="Paso 2 para medir muñeca" width={400} height={400} />
                        <Image src="/resources/como_medir/paso_3_mano.jpg" alt="Paso 3 para medir muñeca" width={400} height={400} />
                      </div>
                    </div>
                  </details>
                </div>
                <div className="pdp-accordion-item">
                  <details>
                    <summary>COMO SABER TU TALLA DE ANILLO</summary>
                    <div className="pdp-accordion-content">
                      <p>Paso 1: Recortamos una tira de papel o un trozo de cordel.</p>
                      <p>Paso 2: Lo colocamos alrededor de nuestro dedo como si fuera un anillo.</p>
                      <p>Paso 3: Realizamos una marca en los extremos del circulo de papel</p>
                      <p>Paso 4: Medimos la distancia en milímetros y buscamos nuestra talla de anillo en la tabla</p>
                      <table className="pdp-size-table">
                        <thead>
                          <tr>
                            <th>MEDIDA</th>
                            <th>TALLA</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td>46.8 mm</td><td>4</td></tr>
                          <tr><td>46.8 mm</td><td>4’5</td></tr>
                          <tr><td>49.3 mm</td><td>5</td></tr>
                          <tr><td>50.6 mm</td><td>5’5</td></tr>
                          <tr><td>51.8 mm</td><td>6</td></tr>
                          <tr><td>51.8 mm</td><td>6’5</td></tr>
                          <tr><td>54.3 mm</td><td>7</td></tr>
                          <tr><td>55.6 mm</td><td>7’5</td></tr>
                          <tr><td>56.9 mm</td><td>8</td></tr>
                          <tr><td>56.9 mm</td><td>8’5</td></tr>
                          <tr><td>59.4 mm</td><td>9</td></tr>
                          <tr><td>60.9 mm</td><td>9’5</td></tr>
                          <tr><td>62.2 mm</td><td>10</td></tr>
                          <tr><td>63.5 mm</td><td>10’5</td></tr>
                          <tr><td>64.7 mm</td><td>11</td></tr>
                          <tr><td>66.0 mm</td><td>11’5</td></tr>
                          <tr><td>67.2 mm</td><td>12</td></tr>
                          <tr><td>67.2 mm</td><td>12’5</td></tr>
                          <tr><td>69.7 mm</td><td>13</td></tr>
                          <tr><td>71.0 mm</td><td>13’5</td></tr>
                          <tr><td>72.3 mm</td><td>14</td></tr>
                        </tbody>
                      </table>
                      <div className="pdp-accordion-images">
                        <Image src="/resources/como_medir/paso_anillos.jpg" alt="Cómo medir tu talla de anillo" width={400} height={400} />
                      </div>
                    </div>
                  </details>
                </div>

              </div>

              {null}
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
              <div className="zoom-img" style={{ transform: `scale(${zoomScale})` }}>
                <Image
                  src={allImages[currentImageIndex] || imagenParaCarrito}
                  alt={color ? `${producto.nombre} · Hilo ${color.nombre}` : producto.nombre}
                  width={800}
                  height={1000}

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
