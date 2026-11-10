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

  const { data: adminRow, error: adminErr } = await supabaseAdmin
    .from("admins")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (adminErr) {
    console.error("[api/admin/auth] admins lookup error", adminErr.message);
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  if (!adminRow) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, userId, email: data.user.email ?? null, role: adminRow.role });
}