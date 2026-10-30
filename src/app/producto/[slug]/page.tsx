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

export default function ProductoPDP({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { addItem } = useCart();
  const { perfil, solicitarEspera } = usePerfil();

  type DBProd = {
    id: string; slug: string; nombre: string; linea: string; precio: number; precio_cop?: number; precioFormato?: string;
    material?: string; categoria?: string; badge?: string; narrativa?: string;     especificaciones?: { material?: string; componentes?: string; piedra?: string };
    tallas?: (string | number)[];
    imagen?: string; imagenes?: string[]; colorHilo?: string; colores_hilo?: string[]; modoAcceso?: string; insignia?: string;
    grupo?: string; coleccion_id?: string;
  };

  const [productoBase, setProductoBase] = useState<DBProd | null>(null);
  const [variantes, setVariantes] = useState<DBProd[]>([]);
  const [lineaActiva, setLineaActiva] = useState<Linea>("origen");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [colorHilo, setColorHilo] = useState<string>("soberbia");
  const [observaciones, setObservaciones] = useState("");
  const [emailEspera, setEmailEspera] = useState("");
  const [esperaRegistrada, setEsperaRegistrada] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase.from("productos").select("*").eq("slug", slug).maybeSingle();
      if (!p) { setProductoBase(null); return; }
      const prod = p as DBProd;
      setProductoBase(prod);
      setLineaActiva(String(prod.linea).toLowerCase() === "singular" ? "singular" : "origen");
      setColorHilo(Array.isArray(prod.colores_hilo) && prod.colores_hilo.length ? prod.colores_hilo[0] : "soberbia");
      setSelectedSize(Array.isArray(prod.tallas) && prod.tallas.length ? String(prod.tallas[0]) : null);
      if (prod.grupo) {
        const { data: vs } = await supabase.from("productos").select("*").eq("grupo", prod.grupo);
        setVariantes((vs || []) as DBProd[]);
      } else {
        setVariantes([prod]);
      }
    };
    load();
  }, [slug]);

  const varianteActual = variantes.find((v) => {
    const cs = Array.isArray(v.colores_hilo) ? v.colores_hilo : [];
    return cs.includes(colorHilo);
  }) || productoBase;
  const producto = varianteActual || productoBase;
  const slugActivo = producto?.slug;

  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [slugActivo, colorHilo]);



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

  const imagenPrincipalVar = (Array.isArray(producto.imagenes) && producto.imagenes.length ? producto.imagenes[0] : producto.imagen) as string;

  const allImages = Array.isArray(producto.imagenes) && producto.imagenes.length > 0
    ? [imagenPrincipalVar, ...producto.imagenes.filter((img: string) => img !== imagenPrincipalVar)]
    : [imagenPrincipalVar];

  const handleAddToCart = () => {
    addItem({
      slug: producto.slug,
      nombre: producto.nombre,
      linea: LINEAS_CORTAS[producto.linea as Linea],
      lineaId: producto.linea as Linea,
      precio: producto.precio,
      imagen: imagenPrincipalVar,
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
      linea: producto.linea as Linea,
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
                    src={allImages[currentImageIndex] || imagenPrincipalVar}
                    alt={`${producto.nombre} · Hilo ${color?.nombre ?? ""}`}
                   unoptimized
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
                <p className="pdp-line">{producto.material}</p>
                <p className="pdp-price">{producto.precioFormato}</p>
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

              <div className="pdp-badge-block">
                <span className="pdp-badge">{producto.badge}</span>
                {producto.insignia && <span className="pdp-badge pdp-badge--exclusiva">{producto.insignia}</span>}
              </div>

              {esSingular ? (
                <div className="pdp-color-fijo">
                  <h3 className="pdp-block-title">Color del hilo</h3>
                  <p className="pdp-color-fijo-text">
                    <span className="color-swatch color-swatch--static" style={{ backgroundColor: color?.hex }} aria-hidden="true" />
                    {color?.nombre} · Fijo según el diseño de la autora
                  </p>
                </div>
              ) : (
                <div className="pdp-color-block">
                  <h3 className="pdp-block-title">Color del hilo</h3>
                  <p className="pdp-color-intro">Cada hilo toma el color de un pecado, o los tonos neutros Oscuridad y Luz. Elige el que te acompaña.</p>
                  <div className="color-swatches">
                    {COLORES_HILO.filter((c) => variantes.some((v) => Array.isArray(v.colores_hilo) && v.colores_hilo.includes(c.id))).map((opcion) => (
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
                  <p className="color-selected">Hilo {color?.nombre} · {color?.pecado}</p>
                </div>
              )}

               {Array.isArray(producto.tallas) && producto.tallas.length > 0 && (
                <div className="pdp-size-block">
                  <h3 className="pdp-block-title">Talla</h3>
                  <div className="pdp-size-options">
                    {producto.tallas.map((t: string | number) => (
                      <button
                        key={String(t)}
                        className={`pdp-size-btn ${selectedSize === String(t) ? "active" : ""}`}
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
                  <button className="pdp-add-btn" onClick={handleAddToCart}>
                    Tejer esta Historia en mi Piel
                  </button>
                ) : producto.modoAcceso === "circulo" ? (
                  <>
                    <Link className="pdp-add-btn pdp-add-btn--outline" href="/mi-perfil">
                      Solicitar Acceso al Círculo
                    </Link>
                    <p className="pdp-access-note">Esta obra no está en stock abierto. Crea tu perfil en el Círculo para solicitar el acceso y ser notificado cuando haya una edición disponible.</p>
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
                    <p className="pdp-access-note">Obra invariable de edición limitada. Guardamos tu lugar en la fila y te escribimos en cuanto haya una unidad.</p>
                  </form>
                )}
              </div>

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

              <div className="pdp-accordion">
                <div className="pdp-accordion-item">
                  <details>
                    <summary>CUIDA DE TUS JOYAS</summary>
                    <div className="pdp-accordion-content">
                      <p>Desde makrama te aconsejamos que hagas un uso adecuado de tus joyas. Son productos que aunque sean duraderos han de ser almacenados de forma independiente evitando el roce y a ser posible en bolsitas. No uses productos abrasivos para su limpieza. Recuerda tratarlas con cariño y mimo. Mas info en Jewellery Care</p>
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
                        <Image src="/resources/como_medir/paso1.jpg" alt="Paso 1 para medir muñeca" width={400} height={400} />
                        <Image src="/resources/como_medir/paso2.jpg" alt="Paso 2 para medir muñeca" width={400} height={400} />
                        <Image src="/resources/como_medir/paso3.jpg" alt="Paso 3 para medir muñeca" width={400} height={400} />
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              <div className="pdp-narrative">
                <h3 className="pdp-block-title">La Historia detrás de esta pieza</h3>
                <p>{producto.narrativa}</p>
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
                  src={allImages[currentImageIndex] || imagenPrincipalVar}
                  alt={`${producto.nombre} · Hilo ${color?.nombre ?? ""}`}
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
