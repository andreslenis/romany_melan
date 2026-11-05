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

const ESTADO_ENVIO_ALLOWED = new Set(["EN_PREPARACION", "ENVIADO", "ENTREGADO"]);

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
