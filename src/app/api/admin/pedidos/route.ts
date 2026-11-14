import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabaseAdmin
    .from("pedidos")
    .select(
      "id, numero_pedido, cliente_nombre, cliente_email, cliente_telefono, items, direccion_envio, total_cop, estado_pago, wompi_status, wompi_transaction_id, estado_envio, guia_rastreo, transportadora, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/pedidos] list error", error.message);
    return NextResponse.json({ error: "db_error", detail: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, pedidos: data ?? [] }, { status: 200 });
}

const ESTADO_ENVIO_ALLOWED = new Set(["EN_PREPARACION", "ENVIADO", "ENTREGADO", "CANCELADO"]);

export async function PATCH(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  let body: { id?: string; estado_envio?: string; transportadora?: string; guia_rastreo?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.estado_envio !== undefined) {
    const v = String(body.estado_envio);
    if (!ESTADO_ENVIO_ALLOWED.has(v)) {
      return NextResponse.json({ error: "invalid_estado_envio" }, { status: 400 });
    }
    patch.estado_envio = v;
  }
  if (body.transportadora !== undefined) patch.transportadora = String(body.transportadora);
  if (body.guia_rastreo !== undefined) patch.guia_rastreo = String(body.guia_rastreo);

  const { data, error } = await supabaseAdmin
    .from("pedidos")
    .update(patch)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[admin/pedidos] update error", error.message, id);
    return NextResponse.json({ error: "db_error", detail: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ ok: true, id: data.id }, { status: 200 });
}

type ItemPedido = {
  slug?: string;
  cantidad?: number | string;
};

/**
 * Deshace el descuento de stock que aplico el post-pago
 * (ver lib/wompi/postpago.ts#descontarStock).
 * Solo procede si el pedido habia procesado efectos post-pago.
 */
async function revertirStock(items: unknown): Promise<void> {
  if (!Array.isArray(items)) return;
  for (const raw of items as ItemPedido[]) {
    const slug = typeof raw?.slug === "string" ? raw.slug : null;
    const cantidad = Math.max(0, Number(raw?.cantidad) || 0);
    if (!slug || cantidad <= 0) continue;

    const { data: producto, error: selErr } = await supabaseAdmin
      .from("productos")
      .select("id, stock_disponible")
      .eq("slug", slug)
      .maybeSingle();

    if (selErr) {
      console.error("[admin/pedidos] revertir stock select error", slug, selErr.message);
      continue;
    }
    if (!producto) {
      console.warn("[admin/pedidos] producto no encontrado para slug", slug);
      continue;
    }

    const actual = Number(producto.stock_disponible) || 0;
    const { error: upErr } = await supabaseAdmin
      .from("productos")
      .update({ stock_disponible: actual + cantidad })
      .eq("id", producto.id);

    if (upErr) {
      console.error("[admin/pedidos] revertir stock update error", slug, upErr.message);
    }
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const { data: pedido, error: findErr } = await supabaseAdmin
    .from("pedidos")
    .select("id, items, post_pago_procesado_at")
    .eq("id", id)
    .maybeSingle();

  if (findErr) {
    console.error("[admin/pedidos] delete find error", findErr.message, id);
    return NextResponse.json({ error: "db_error", detail: findErr.message }, { status: 500 });
  }
  if (!pedido) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Solo revertimos si el post-pago ya descontó el stock (marca atómica).
  if (pedido.post_pago_procesado_at) {
    try {
      await revertirStock(pedido.items);
    } catch (e) {
      console.error("[admin/pedidos] revertirStock exception", e);
    }
  }

  const { error: delErr } = await supabaseAdmin.from("pedidos").delete().eq("id", id);
  if (delErr) {
    console.error("[admin/pedidos] delete error", delErr.message, id);
    return NextResponse.json({ error: "db_error", detail: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id }, { status: 200 });
}
