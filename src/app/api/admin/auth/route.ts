import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const userId = data.user.id;
  const email = data.user.email?.toLowerCase().trim() ?? null;

  // El rol vive en perfiles.rol: 'admin' puede entrar; el resto no.
  let rol: string | null = null;

  if (email) {
    const { data: perfilRow, error: perfilErr } = await supabaseAdmin
      .from("perfiles")
      .select("rol")
      .eq("email", email)
      .maybeSingle();

    if (perfilErr) {
      console.error("[api/admin/auth] perfiles lookup error", perfilErr.message);
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    if (perfilRow && typeof perfilRow === "object" && "rol" in perfilRow) {
      rol = String((perfilRow as Record<string, unknown>).rol ?? "").trim() || null;
    }
  }

  // Compatibilidad: si no hay rol en perfiles, revisar la tabla admins (legado).
  if (!rol || rol === "cliente") {
    const { data: adminRow, error: adminErr } = await supabaseAdmin
      .from("admins")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (adminErr) {
      console.error("[api/admin/auth] admins lookup error", adminErr.message);
    }

    if (!adminRow && rol !== "admin") {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }
  }

  if (rol !== "admin") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, userId, email, role: "admin" });
}