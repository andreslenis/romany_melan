import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

type ComisionRow = {
  id: string;
  pedido_id: string;
  codigo_usado: string;
  subtotal_productos: number;
  descuento_aplicado: number;
  total_con_descuento: number;
  comision_porcentaje: number;
  comision_monto: number;
  estado: string;
  created_at: string;
  pedidos: Array<{ numero_pedido: string }> | null;
};

type EmbajadorRow = {
  id: string;
  nombre: string;
  telefono: string;
  codigo: string;
  activo: boolean;
  comision_acumulada: number;
  comision_pendiente: number;
  ultima_liquidacion: string | null;
  created_at: string;
  codigos_descuento: Array<{
    id: string;
    codigo: string;
    porcentaje_descuento: number;
    porcentaje_comision: number;
    activo: boolean;
    usos_totales: number;
  }> | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const embajadorId = searchParams.get("embajador_id");

    if (embajadorId) {
      // Obtener comisiones de un embajador específico
      const { data, error } = await supabaseAdmin
        .from("comisiones_embajador")
        .select(`
          id,
          pedido_id,
          codigo_usado,
          subtotal_productos,
          descuento_aplicado,
          total_con_descuento,
          comision_porcentaje,
          comision_monto,
          estado,
          created_at,
          pedidos:pedido_id (numero_pedido)
        `)
        .eq("embajador_id", embajadorId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[admin/embajadores] comisiones error", error.message);
        return NextResponse.json({ ok: false, error: "db_error", detail: error.message }, { status: 500 });
      }

      const comisiones = (data || []).map((c: ComisionRow) => ({
        ...c,
        pedido_numero: c.pedidos?.[0]?.numero_pedido || c.pedido_id.slice(0, 8),
      }));

      return NextResponse.json({ ok: true, comisiones });
    }

    // Listar todos los embajadores con sus códigos y estadísticas
    const { data: embajadores, error } = await supabaseAdmin
      .from("embajadores")
      .select(`
        id,
        nombre,
        telefono,
        codigo,
        activo,
        comision_acumulada,
        comision_pendiente,
        ultima_liquidacion,
        created_at,
        codigos_descuento!embajador_id (
          id,
          codigo,
          porcentaje_descuento,
          porcentaje_comision,
          activo,
          usos_totales
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/embajadores] list error", error.message);
      return NextResponse.json({ ok: false, error: "db_error", detail: error.message }, { status: 500 });
    }

    const formatted = (embajadores || []).map((e: EmbajadorRow) => {
      const codigo = e.codigos_descuento?.[0];
      return {
        id: e.id,
        nombre: e.nombre,
        telefono: e.telefono,
        codigo: e.codigo,
        activo: e.activo,
        comision_acumulada: Number(e.comision_acumulada || 0),
        comision_pendiente: Number(e.comision_pendiente || 0),
        ultima_liquidacion: e.ultima_liquidacion,
        created_at: e.created_at,
        usos_totales: codigo?.usos_totales || 0,
        porcentaje_descuento: codigo?.porcentaje_descuento ?? 5,
        porcentaje_comision: codigo?.porcentaje_comision ?? 10,
      };
    });

    return NextResponse.json({ ok: true, embajadores: formatted });
  } catch (e) {
    console.error("[admin/embajadores] GET error", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let body: {
      nombre?: string;
      telefono?: string;
      codigo?: string;
      activo?: boolean;
      porcentaje_descuento?: number;
      porcentaje_comision?: number;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }

    const nombre = String(body.nombre || "").trim();
    const telefono = String(body.telefono || "").trim();
    const codigo = String(body.codigo || "").trim().toUpperCase();
    const activo = body.activo !== false;
    const porcentajeDescuento = Number.isFinite(body.porcentaje_descuento)
      ? Number(body.porcentaje_descuento)
      : 5;
    const porcentajeComision = Number.isFinite(body.porcentaje_comision)
      ? Number(body.porcentaje_comision)
      : 10;

    if (!nombre || !telefono || !codigo) {
      return NextResponse.json({ ok: false, error: "missing_fields", required: ["nombre", "telefono", "codigo"] }, { status: 400 });
    }

    // Verificar que el código no exista
    const { data: existingCodigo } = await supabaseAdmin
      .from("codigos_descuento")
      .select("id")
      .eq("codigo", codigo)
      .maybeSingle();

    if (existingCodigo) {
      return NextResponse.json({ ok: false, error: "codigo_existe", detail: "El código ya está en uso" }, { status: 409 });
    }

    // Crear embajador y código en una transacción
    const { data: embajador, error: embajadorError } = await supabaseAdmin
      .from("embajadores")
      .insert({ nombre, telefono, codigo, activo })
      .select("id")
      .maybeSingle();

    if (embajadorError) {
      console.error("[admin/embajadores] create embajador error", embajadorError.message);
      return NextResponse.json({ ok: false, error: "db_error", detail: embajadorError.message }, { status: 500 });
    }

    const { error: codigoError } = await supabaseAdmin
      .from("codigos_descuento")
      .insert({
        codigo,
        embajador_id: embajador!.id,
        porcentaje_descuento: porcentajeDescuento,
        porcentaje_comision: porcentajeComision,
        activo,
      });

    if (codigoError) {
      // Rollback: eliminar embajador si falla el código
      await supabaseAdmin.from("embajadores").delete().eq("id", embajador!.id);
      console.error("[admin/embajadores] create codigo error", codigoError.message);
      return NextResponse.json({ ok: false, error: "db_error", detail: codigoError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, embajador: { id: embajador!.id, nombre, telefono, codigo, activo } });
  } catch (e) {
    console.error("[admin/embajadores] POST error", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    let body: {
      nombre?: string;
      telefono?: string;
      codigo?: string;
      activo?: boolean;
      porcentaje_descuento?: number;
      porcentaje_comision?: number;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (body.nombre !== undefined) updates.nombre = String(body.nombre).trim();
    if (body.telefono !== undefined) updates.telefono = String(body.telefono).trim();
    if (body.activo !== undefined) updates.activo = body.activo;
    if (body.porcentaje_descuento !== undefined)
      updates.porcentaje_descuento = Number(body.porcentaje_descuento);
    if (body.porcentaje_comision !== undefined)
      updates.porcentaje_comision = Number(body.porcentaje_comision);

    // El código no se puede cambiar (está en ambas tablas)
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: false, error: "no_changes" }, { status: 400 });
    }

    // Actualizar embajador
    const { error: embajadorError } = await supabaseAdmin
      .from("embajadores")
      .update(updates)
      .eq("id", id);

    if (embajadorError) {
      console.error("[admin/embajadores] update error", embajadorError.message);
      return NextResponse.json({ ok: false, error: "db_error", detail: embajadorError.message }, { status: 500 });
    }

    // Si cambió el estado activo, también actualizar el código
    if (body.activo !== undefined) {
      // Obtener el código del embajador
      const { data: embajador } = await supabaseAdmin
        .from("embajadores")
        .select("codigo")
        .eq("id", id)
        .maybeSingle();

      if (embajador) {
        await supabaseAdmin
          .from("codigos_descuento")
          .update({ activo: body.activo })
          .eq("codigo", embajador.codigo);
      }
    }

    // Sincronizar porcentajes de descuento y comisión con el código del embajador
    if (body.porcentaje_descuento !== undefined || body.porcentaje_comision !== undefined) {
      const { data: embajador } = await supabaseAdmin
        .from("embajadores")
        .select("codigo")
        .eq("id", id)
        .maybeSingle();

      if (embajador) {
        const porcentajeUpdates: Record<string, unknown> = {};
        if (body.porcentaje_descuento !== undefined)
          porcentajeUpdates.porcentaje_descuento = Number(body.porcentaje_descuento);
        if (body.porcentaje_comision !== undefined)
          porcentajeUpdates.porcentaje_comision = Number(body.porcentaje_comision);

        await supabaseAdmin
          .from("codigos_descuento")
          .update(porcentajeUpdates)
          .eq("codigo", embajador.codigo);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/embajadores] PATCH error", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}