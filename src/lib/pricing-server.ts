import { supabaseAdmin } from "@/lib/supabase/server";
import { precioFinal } from "@/utils/precio";

export type LineaCarrito = {
  slug: string;
  cantidad: number;
  talla?: string | null;
  colorHilo?: string | null;
};

export type ItemConPrecio = LineaCarrito & {
  nombre: string;
  precio: number;
};

export type ResultadoPrecio =
  | { ok: true; items: ItemConPrecio[]; total: number; amountInCents: number }
  | { ok: false; error: "producto_no_disponible" | "carrito_vacio" | "db_error"; slug?: string };

type FilaProducto = {
  slug: string | null;
  nombre: string | null;
  precio_cop: number | string | null;
  precio_promo: number | string | null;
  promo_activa: boolean | null;
  activo: boolean | null;
};

/**
 * Resuelve el precio real de cada línea del carrito consultando la base de datos.
 * Es la única fuente de verdad para el monto que se cobra: el navegador no decide precios.
 */
type LineaEntrada = LineaCarrito & { nombre?: string };

export async function resolverPrecios(items: LineaEntrada[]): Promise<ResultadoPrecio> {
  const lineas = items
    .map((item) => ({ ...item, slug: String(item.slug ?? "").trim() }))
    .filter((item) => item.slug.length > 0);

  if (!lineas.length) {
    return { ok: false, error: "carrito_vacio" };
  }

  const slugs = Array.from(new Set(lineas.map((item) => item.slug)));

  const { data, error } = await supabaseAdmin
    .from("productos")
    .select("slug, nombre, precio_cop, precio_promo, promo_activa, activo")
    .in("slug", slugs);

  if (error) {
    console.error("[pricing-server] select error", error.message);
    return { ok: false, error: "db_error" };
  }

  const porSlug = new Map<string, { nombre: string; precio: number }>();

  for (const raw of (data ?? []) as FilaProducto[]) {
    const slug = raw?.slug ? String(raw.slug) : "";
    if (!slug) continue;
    if (raw.activo === false) continue;

    porSlug.set(slug, {
      nombre: String(raw.nombre ?? ""),
      precio: precioFinal({
        precio: Number(raw.precio_cop ?? 0),
        precioPromo: raw.precio_promo === null || raw.precio_promo === undefined ? null : Number(raw.precio_promo),
        promoActiva: Boolean(raw.promo_activa),
      }),
    });
  }

  const resueltos: ItemConPrecio[] = [];
  let total = 0;

  for (const item of lineas) {
    const info = porSlug.get(item.slug);
    if (!info) {
      return { ok: false, error: "producto_no_disponible", slug: item.slug };
    }

    const cantidad = Math.max(0, Math.floor(Number(item.cantidad) || 0));
    const precio = Math.max(0, Math.round(info.precio));

    resueltos.push({
      ...item,
      nombre: info.nombre || item.nombre || "",
      precio,
      cantidad,
    });
    total += precio * cantidad;
  }

  return {
    ok: true,
    items: resueltos,
    total,
    amountInCents: Math.round(total * 100),
  };
}