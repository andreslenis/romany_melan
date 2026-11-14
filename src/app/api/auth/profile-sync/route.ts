import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function proveedorDe(user: { app_metadata?: Record<string, unknown> }): string {
  const provider = user.app_metadata?.provider;
  if (provider === "apple") return "apple";
  if (provider === "google") return "google";
  return "manual";
}

function nombreDe(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): string {
  const meta = user.user_metadata ?? {};
  const full = typeof meta.full_name === "string" ? meta.full_name.trim() : "";
  if (full) return full;
  const name = typeof meta.name === "string" ? meta.name.trim() : "";
  if (name) return name;
  return user.email?.split("@")[0] || "Cliente";
}

export async function POST(req: Request) {
  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  const user = data?.user;

  if (error || !user) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const email = user.email?.toLowerCase().trim() || null;

  if (!email) {
    return NextResponse.json({ ok: true, synced: false, reason: "sin_email" });
  }

  const nombre = nombreDe(user);
  const proveedor = proveedorDe(user);

  try {
    const { data: existing, error: selErr } = await supabaseAdmin
      .from("perfiles")
      .select("id, nombre, telefono, user_id")
      .eq("email", email)
      .maybeSingle();

    if (selErr) {
      console.error("[api/auth/profile-sync] select error", selErr.message);
      return NextResponse.json({ ok: true, synced: false, reason: "db_select" });
    }

    if (existing) {
      const patch: Record<string, unknown> = {};
      if (!existing.nombre) patch.nombre = nombre;
      if (!existing.user_id) patch.user_id = user.id;
      if (Object.keys(patch).length) {
        const { error: upErr } = await supabaseAdmin
          .from("perfiles")
          .update(patch)
          .eq("id", existing.id);
        if (upErr) {
          console.error("[api/auth/profile-sync] update error", upErr.message);
        }
      }
      return NextResponse.json({ ok: true, synced: true, created: false });
    }

    const telefonoMeta = user.user_metadata?.phone;
    const { error: insErr } = await supabaseAdmin.from("perfiles").insert({
      user_id: user.id,
      nombre,
      email,
      telefono: typeof telefonoMeta === "string" ? telefonoMeta : "",
      miembro: true,
      proveedor,
    });

    if (insErr) {
      console.error("[api/auth/profile-sync] insert error", insErr.message);
      return NextResponse.json({ ok: true, synced: false, reason: "db_insert" });
    }

    return NextResponse.json({ ok: true, synced: true, created: true });
  } catch (e) {
    console.error("[api/auth/profile-sync] error inesperado", e);
    return NextResponse.json({ ok: true, synced: false, reason: "unexpected" });
  }
}