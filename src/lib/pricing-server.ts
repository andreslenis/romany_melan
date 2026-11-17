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
  precioOriginal?: number;
  descuento?: number;
};

export type ResultadoPrecio =
  | { ok: true; items: ItemConPrecio[]; total: number; amountInCents: number; codigoAplicado?: string; descuentoTotal?: number }
  | { ok: false; error: "producto_no_disponible" | "carrito_vacio" | "db_error" | "codigo_invalido"; slug?: string; detail?: string };

type FilaProducto = {
  slug: string | null;
  nombre: string | null;
  precio_cop: number | string | null;
  precio_promo: number | string | null;
  promo_activa: boolean | null;
  activo: boolean | null;
};

type FilaCodigoDescuento = {
  id: string;
  codigo: string;
  embajador_id: string;
  porcentaje_descuento: number;
  activo: boolean;
};

/**
 * Resuelve el precio real de cada línea del carrito consultando la base de datos.
 * Es la única fuente de verdad para el monto que se cobra: el navegador no decide precios.
 * Si se proporciona un código de descuento válido, aplica 5% de descuento a cada producto.
 */
type LineaEntrada = LineaCarrito & { nombre?: string };

export async function resolverPrecios(items: LineaEntrada[], codigoDescuento?: string): Promise<ResultadoPrecio> {
  const lineas = items
    .map((item) => ({ ...item, slug: String(item.slug ?? "").trim() }))
    .filter((item) => item.slug.length > 0);

  if (!lineas.length) {
    return { ok: false, error: "carrito_vacio" };
  }

  const slugs = Array.from(new Set(lineas.map((item) => item.slug)));

  // Obtener productos
  const { data: productosData, error: productosError } = await supabaseAdmin
    .from("productos")
    .select("slug, nombre, precio_cop, precio_promo, promo_activa, activo")
    .in("slug", slugs);

  if (productosError) {
    console.error("[pricing-server] select productos error", productosError.message);
    return { ok: false, error: "db_error" };
  }

  const porSlug = new Map<string, { nombre: string; precio: number }>();

  for (const raw of (productosData ?? []) as FilaProducto[]) {
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

  // Validar código de descuento si se proporciona
  let codigoInfo: FilaCodigoDescuento | null = null;
  let porcentajeDescuento = 0;

  if (codigoDescuento) {
    const { data: codigoData, error: codigoError } = await supabaseAdmin
      .from("codigos_descuento")
      .select("id, codigo, embajador_id, porcentaje_descuento, activo")
      .eq("codigo", codigoDescuento.toUpperCase())
      .maybeSingle();

    if (codigoError) {
      console.error("[pricing-server] select codigo error", codigoError.message);
      return { ok: false, error: "db_error" };
    }

    if (!codigoData || !codigoData.activo) {
      return { ok: false, error: "codigo_invalido", detail: "Código de descuento no válido o inactivo" };
    }

    codigoInfo = codigoData as FilaCodigoDescuento;

    // Obtener embajador
    const { data: embajadorData, error: embajadorError } = await supabaseAdmin
      .from("embajadores")
      .select("id, nombre, telefono, codigo, activo")
      .eq("id", codigoInfo.embajador_id)
      .maybeSingle();

    if (embajadorError) {
      console.error("[pricing-server] select embajador error", embajadorError.message);
      return { ok: false, error: "db_error" };
    }

    if (!embajadorData || !embajadorData.activo) {
      return { ok: false, error: "codigo_invalido", detail: "Embajador asociado no activo" };
    }

    porcentajeDescuento = Number(codigoInfo.porcentaje_descuento) || 5; // Default 5%
  }

  const resueltos: ItemConPrecio[] = [];
  let total = 0;
  let descuentoTotal = 0;

  for (const item of lineas) {
    const info = porSlug.get(item.slug);
    if (!info) {
      return { ok: false, error: "producto_no_disponible", slug: item.slug };
    }

    const cantidad = Math.max(0, Math.floor(Number(item.cantidad) || 0));
    const precioOriginal = Math.max(0, Math.round(info.precio));
    let precioFinalItem = precioOriginal;
    let descuentoItem = 0;

    if (porcentajeDescuento > 0) {
      descuentoItem = Math.round(precioOriginal * (porcentajeDescuento / 100));
      precioFinalItem = precioOriginal - descuentoItem;
    }

    const subtotalItem = precioFinalItem * cantidad;
    const descuentoSubtotalItem = descuentoItem * cantidad;

    resueltos.push({
      ...item,
      nombre: info.nombre || item.nombre || "",
      precio: precioFinalItem,
      precioOriginal,
      descuento: descuentoItem > 0 ? descuentoItem : undefined,
      cantidad,
    });
    total += subtotalItem;
    descuentoTotal += descuentoSubtotalItem;
  }

  return {
    ok: true,
    items: resueltos,
    total,
    amountInCents: Math.round(total * 100),
    codigoAplicado: codigoInfo?.codigo,
    descuentoTotal: descuentoTotal > 0 ? descuentoTotal : undefined,
  };
}