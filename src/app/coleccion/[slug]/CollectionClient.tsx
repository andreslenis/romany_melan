"use client";

import Link from "next/link";
import Image from "next/image";
import { use, useEffect, useState } from "react";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { supabase } from "@/lib/supabase/client";

type Producto = {
  id: string;
  slug: string;
  nombre: string;
  linea: "origen" | "singular" | "ORIGEN" | "SINGULAR";
  precio_cop?: number;
  descripcion_corta?: string;
  imagenes?: string[];
  activo?: boolean;
};

type Coleccion = { id: string; nombre: string; relato_poetico?: string };

export default function CollectionClient({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [coleccion, setColeccion] = useState<Coleccion | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [linea, setLinea] = useState<"origen" | "singular">("origen");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: col } = await supabase.from("colecciones").select("*").ilike("nombre", slug).maybeSingle();
      // fallback: match by slug-ish name lower
      let c = col as Coleccion | null;
      if (!c) {
        const { data: cols } = await supabase.from("colecciones").select("*");
        c = (cols || []).find((x: Coleccion) => String(x.nombre).toLowerCase() === slug.toLowerCase()) || null;
      }
      setColeccion(c);
      if (c) {
        const { data: prods } = await supabase.from("productos").select("*").eq("coleccion_id", c.id).eq("activo", true).order("nombre");
        setProductos((prods || []) as Producto[]);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  const norm = (l: string | number | boolean | null | undefined) => String(l).toLowerCase();
  const productosLinea = productos.filter((p) => norm(p.linea) === linea);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="collection-hero">
          <div className="container collection-hero-content">
            <h1 className="collection-hero-title">{(coleccion?.nombre || slug).toUpperCase()}</h1>
            {coleccion?.relato_poetico && <p className="collection-hero-text">{coleccion.relato_poetico}</p>}
          </div>
        </section>
        <section className="line-selector">
          <div className="container line-selector-inner">
            <div className="line-tabs">
              <button className={`line-tab ${linea === "origen" ? "active" : ""}`} onClick={() => setLinea("origen")}>Línea Origen</button>
              <button className={`line-tab ${linea === "singular" ? "active" : ""}`} onClick={() => setLinea("singular")}>Línea Singular</button>
            </div>
          </div>
        </section>
        <section className="products-section">
          <div className="container">
            <div className="products-grid">
              {loading ? <p>Cargando…</p> : productosLinea.length === 0 ? <p>No hay piezas disponibles.</p> : productosLinea.map((p) => {
                const img = Array.isArray(p.imagenes) && p.imagenes.length ? p.imagenes[0] : "";
                return (
                  <article key={p.slug || p.id} className="product-card">
                    <Link className="product-card-media product-card-media--link" href={`/producto/${p.slug}`}>
                      {img && <Image src={img} alt={p.nombre} fill style={{ objectFit: "cover" }} sizes="33vw" />}
                    </Link>
                    <div className="product-card-body">
                      <h3 className="product-card-title">{p.nombre}</h3>
                      {p.precio_cop ? <p className="product-card-price">${Number(p.precio_cop).toLocaleString("es-CO")} COP</p> : null}
                      <Link className="product-card-btn" href={`/producto/${p.slug}`}>Conoce su Historia</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}