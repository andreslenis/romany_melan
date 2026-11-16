import Link from "next/link";
import Image from "next/image";

import ProductPrice from "@/components/product/ProductPrice";
import { altProducto } from "@/lib/seo";
import type { ProductoDB } from "@/lib/supabase/queries";

interface RelatedProductsProps {
  productos: ProductoDB[];
}

export default function RelatedProducts({ productos }: RelatedProductsProps) {
  if (!productos || productos.length === 0) return null;

  return (
    <section className="related-section" aria-labelledby="related-title">
      <div className="container">
        <h2 className="related-title" id="related-title">
          También puede interesarte
        </h2>
        <div className="products-grid related-grid">
          {productos.map((producto) => {
            const imagen =
              (Array.isArray(producto.imagenes) && producto.imagenes[0]) ||
              producto.imagen ||
              "";
            const precio = Number(producto.precio_cop ?? 0);

            return (
              <article key={producto.slug} className="product-card">
                <Link
                  className="product-card-media product-card-media--link"
                  href={`/producto/${producto.slug}`}
                  aria-label={`Conoce la historia de ${producto.nombre}`}
                >
                  {imagen && (
                    <Image
                      src={imagen}
                      alt={altProducto({
                        nombre: producto.nombre,
                        material: producto.especificaciones?.material,
                        piedra: producto.especificaciones?.piedra,
                      })}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 640px) 90vw, 360px"
                    />
                  )}
                </Link>
                <div className="product-card-body">
                  <h3 className="product-card-title">{producto.nombre}</h3>
                  {precio > 0 ? (
                    <p className="product-card-price">
                      <ProductPrice
                        precio={precio}
                        precioPromo={producto.precio_promo}
                        promoActiva={producto.promo_activa}
                      />
                    </p>
                  ) : null}
                  <Link
                    className="product-card-btn"
                    href={`/producto/${producto.slug}`}
                  >
                    Conoce su Historia
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}