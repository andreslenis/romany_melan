import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const [{ data: pedidos, error: pErr }, { data: perfiles, error: prErr }] = await Promise.all([
    supabaseAdmin
      .from("pedidos")
      .select("id, cliente_nombre, cliente_email, cliente_telefono, items, total_cop, created_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("perfiles")
      .select("id, user_id, nombre, email, telefono, miembro"),
  ]);

  if (pErr) {
    console.error("[admin/clientes] pedidos error", pErr.message);
    return NextResponse.json({ error: "db_error", detail: pErr.message }, { status: 500 });
  }
  if (prErr) {
    console.error("[admin/clientes] perfiles error", prErr.message);
    return NextResponse.json({ error: "db_error", detail: prErr.message }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, pedidos: pedidos ?? [], perfiles: perfiles ?? [] },
    { status: 200 }
  );
}
