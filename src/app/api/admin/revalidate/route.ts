import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/auth";

// Revalida el home (ISR) bajo demanda tras cambios en el gestor de colecciones.
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  revalidatePath("/");
  return NextResponse.json({ ok: true, revalidated: true });
}