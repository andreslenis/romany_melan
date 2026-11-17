import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    let body: {
      embajador_id?: string;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }

    const embajador_id = body.embajador_id;

    if (!embajador_id) {
      return NextResponse.json({ ok: false, error: "missing_embajador_id" }, { status: 400 });
    }

    // Llamar a la función RPC para liquidar comisiones
    const { error } = await supabaseAdmin.rpc("liquidar_comisiones_embajador", {
      embajador_id_param: embajador_id,
    });

    if (error) {
      console.error("[admin/embajadores/liquidar] rpc error", error.message);
      return NextResponse.json({ ok: false, error: "db_error", detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/embajadores/liquidar] POST error", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}