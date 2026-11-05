import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export type AdminAuth =
  | { ok: true; userId: string; email: string | null }
  | { ok: false; response: NextResponse };

function bearer(req: Request): string | null {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1].trim() : null;
}

export async function requireAdmin(req: Request): Promise<AdminAuth> {
  const token = bearer(req);
  if (!token) {
    return { ok: false, response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false, response: NextResponse.json({ error: "server_misconfigured" }, { status: 500 }) };
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data?.user) {
    return { ok: false, response: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  }

  const userId = data.user.id;
  const { data: adminRow, error: adminErr } = await supabaseAdmin
    .from("admins")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (adminErr) {
    console.error("[admin/auth] admins lookup error", adminErr.message);
    return { ok: false, response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  if (!adminRow) {
    return { ok: false, response: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }

  return { ok: true, userId, email: data.user.email ?? null };
}
