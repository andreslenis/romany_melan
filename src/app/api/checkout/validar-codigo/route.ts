import { NextResponse } from "next/server";
import { resolverPrecios } from "@/lib/pricing-server";

type ItemIn = {
  slug?: string;
  nombre?: string;
  precio?: number;
  cantidad?: number;
  talla?: string | null;
  colorHilo?: string | null;
  colorHiloHex?: string | null;
  observaciones?: string;
  linea?: string;
  lineaId?: string;
  imagen?: string;
  coleccion?: string | null;
};

export async function POST(req: Request) {
  let body: {
    codigo?: string;
    items?: ItemIn[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const codigo = String(body.codigo || "").trim().toUpperCase();
  const itemsRaw = Array.isArray(body.items) ? body.items : [];

  if (!codigo) {
    return NextResponse.json({ ok: false, error: "Código requerido" }, { status: 400 });
  }

  if (!itemsRaw.length) {
    return NextResponse.json({ ok: false, error: "Carrito vacío" }, { status: 400 });
  }

  const lineas = itemsRaw
    .map((item) => ({
      ...item,
      slug: String(item.slug ?? "").trim(),
      cantidad: Number(item.cantidad) || 0,
    }))
    .filter((item) => item.slug.length > 0);

  if (!lineas.length) {
    return NextResponse.json({ ok: false, error: "Carrito vacío" }, { status: 400 });
  }

  // Validar código y calcular precios con descuento
  const resuelto = await resolverPrecios(lineas, codigo);

  if (!resuelto.ok) {
    if (resuelto.error === "codigo_invalido") {
      return NextResponse.json({ ok: false, error: resuelto.detail || "Código de descuento no válido" }, { status: 400 });
    }
    if (resuelto.error === "producto_no_disponible") {
      return NextResponse.json({ ok: false, error: "Uno de los productos ya no está disponible" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: resuelto.error || "Error al procesar" }, { status: 400 });
  }

  // Preparar respuesta con detalle por item
  const itemsConDetalle = resuelto.items.map((item) => ({
    slug: item.slug,
    precioOriginal: item.precioOriginal ?? item.precio,
    precioConDescuento: item.precio,
    descuento: item.descuento ?? 0,
    cantidad: item.cantidad,
  }));

  return NextResponse.json({
    ok: true,
    valido: true,
    codigoAplicado: resuelto.codigoAplicado,
    descuentoTotal: resuelto.descuentoTotal ?? 0,
    totalConDescuento: resuelto.total,
    items: itemsConDetalle,
  });
}