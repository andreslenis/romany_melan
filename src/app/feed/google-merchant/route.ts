import { createClientServer } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo";
import { precioFinal } from "@/utils/precio";
import type { ProductoDB } from "@/lib/supabase/queries";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

async function getProductosParaFeed(): Promise<ProductoDB[]> {
  const supabase = createClientServer();
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
    .eq("modo_acceso", "disponible")
    .gt("stock_disponible", 0)
    .order("nombre");

  if (error) {
    console.error("[feed] getProductosParaFeed", error.message);
    return [];
  }
  return (data || []) as ProductoDB[];
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;")
    .replace(/'/g, "\u0026apos;");
}

function buildProductXml(producto: ProductoDB, coleccionNombre: string | null): string {
  const precio = precioFinal({
    precio: producto.precio_cop || 0,
    precioPromo: producto.precio_promo,
    promoActiva: producto.promo_activa,
  });

  const precioRegular = Number(producto.precio_cop) || 0;
  const enPromo = Boolean(producto.promo_activa) && Number(producto.precio_promo || 0) > 0;

  const link = `${SITE_URL}/producto/${producto.slug}`;
  const imageLink = producto.imagen
    ? `${SITE_URL}${producto.imagen.startsWith("/") ? "" : "/"}${producto.imagen}`
    : `${SITE_URL}/resources/icons/icon.png`;

  const descripcion = [
    producto.descripcion_corta,
    producto.narrativa,
    producto.historia_narrativa,
    producto.material,
    producto.categoria,
  ]
    .filter(Boolean)
    .join(" \u00b7 ")
    .slice(0, 5000);

  const googleProductCategory = "Jewelry > Necklaces & Pendants";
  const brand = "Romany Melan";
  const condition = "new";
  const availability = "in stock";
  const currency = "COP";

  const productType = coleccionNombre ? `Joyería > ${coleccionNombre}` : "Joyería";

  let xml = `    <item>\n`;
  xml += `      <g:id>${escapeXml(producto.id)}</g:id>\n`;
  xml += `      <title>${escapeXml(producto.nombre)}</title>\n`;
  xml += `      <description>${escapeXml(descripcion)}</description>\n`;
  xml += `      <link>${escapeXml(link)}</link>\n`;
  xml += `      <g:image_link>${escapeXml(imageLink)}</g:image_link>\n`;
  xml += `      <g:availability>${availability}</g:availability>\n`;
  xml += `      <g:price>${precio.toFixed(2)} ${currency}</g:price>\n`;

  if (enPromo && precioRegular > precio) {
    xml += `      <g:sale_price>${precio.toFixed(2)} ${currency}</g:sale_price>\n`;
    const startDate = new Date().toISOString().split("T")[0];
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    xml += `      <g:sale_price_effective_date>${startDate}T00:00-05:00/${endDate}T23:59-05:00</g:sale_price_effective_date>\n`;
  }

  xml += `      <g:google_product_category>${escapeXml(googleProductCategory)}</g:google_product_category>\n`;
  xml += `      <g:product_type>${escapeXml(productType)}</g:product_type>\n`;
  xml += `      <g:brand>${escapeXml(brand)}</g:brand>\n`;
  xml += `      <g:condition>${condition}</g:condition>\n`;

  if (producto.material) {
    xml += `      <g:material>${escapeXml(producto.material)}</g:material>\n`;
  }

  if (producto.colores_hilo) {
    const colores = Array.isArray(producto.colores_hilo)
      ? producto.colores_hilo
      : [producto.colores_hilo];
    for (const color of colores) {
      if (color) {
        xml += `      <g:color>${escapeXml(String(color))}</g:color>\n`;
      }
    }
  }

  if (producto.tallas && producto.tallas.length > 0) {
    for (const talla of producto.tallas) {
      xml += `      <g:size>${escapeXml(String(talla))}</g:size>\n`;
    }
  }

  xml += `      <g:mpn>${escapeXml(producto.id)}</g:mpn>\n`;

  if (producto.grupo) {
    xml += `      <g:item_group_id>${escapeXml(producto.grupo)}</g:item_group_id>\n`;
  }

  if (producto.imagenes && producto.imagenes.length > 1) {
    for (const img of producto.imagenes.slice(1)) {
      const fullImgUrl = `${SITE_URL}${img.startsWith("/") ? "" : "/"}${img}`;
      xml += `      <g:additional_image_link>${escapeXml(fullImgUrl)}</g:additional_image_link>\n`;
    }
  }

  xml += `    </item>\n`;
  return xml;
}

export async function GET() {
  try {
    const [productos, colecciones] = await Promise.all([
      getProductosParaFeed(),
      (async () => {
        const supabase = createClientServer();
        const { data } = await supabase.from("colecciones").select("id, nombre");
        return (data || []) as { id: string; nombre: string }[];
      })(),
    ]);

    const coleccionMap = new Map(colecciones.map((c) => [c.id, c.nombre]));

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n';
    xml += "  <channel>\n";
    xml += `    <title>${escapeXml("Romany Melan - Product Feed")}</title>\n`;
    xml += `    <link>${escapeXml(SITE_URL)}</link>\n`;
    xml += `    <description>${escapeXml("Feed de productos para Google Merchant Center")}</description>\n`;

    for (const producto of productos) {
      const coleccionNombre = producto.coleccion_id
        ? coleccionMap.get(producto.coleccion_id) || null
        : null;
      xml += buildProductXml(producto, coleccionNombre);
    }

    xml += "  </channel>\n";
    xml += "</rss>";

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("[feed] Error generando feed:", error);
    return new Response("Error generating feed", { status: 500 });
  }
}