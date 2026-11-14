import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { precioFinal } from "@/utils/precio";

export const dynamic = "force-dynamic";

type FilaProducto = {
  slug: string | null;
  nombre: string | null;
  precio_cop: number | string | null;
  precio_promo: number | string | null;
  promo_activa: boolean | null;
  activo: boolean | null;
};

/**
 * Devuelve el precio vigente de cada pieza del carrito.
 * Solo expone datos públicos del catálogo (nombre, precio, disponibilidad).
 */
export async function POST(req: Request) {
  let body: { slugs?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const slugs = Array.isArray(body.slugs)
    ? Array.from(
        new Set(
          body.slugs
            .map((slug) => String(slug ?? "").trim())
            .filter((slug) => slug.length > 0)
        )
      )
    : [];

  if (!slugs.length) {
    return NextResponse.json({ ok: true, precios: {} }, { status: 200 });
  }

  const { data, error } = await supabaseAdmin
    .from("productos")
    .select("slug, nombre, precio_cop, precio_promo, promo_activa, activo")
    .in("slug", slugs);

  if (error) {
    console.error("[cart/pricing] select error", error.message);
    return NextResponse.json({ error: "db_error", detail: error.message }, { status: 500 });
  }

  const precios: Record<string, { nombre: string; precio: number; activo: boolean }> = {};

  for (const raw of (data ?? []) as FilaProducto[]) {
    const slug = raw?.slug ? String(raw.slug) : "";
    if (!slug) continue;

    precios[slug] = {
      nombre: String(raw.nombre ?? ""),
      precio: precioFinal({
        precio: Number(raw.precio_cop ?? 0),
        precioPromo: raw.precio_promo === null || raw.precio_promo === undefined ? null : Number(raw.precio_promo),
        promoActiva: Boolean(raw.promo_activa),
      }),
      activo: raw.activo !== false,
    };
  }

  return NextResponse.json({ ok: true, precios }, { status: 200 });
}