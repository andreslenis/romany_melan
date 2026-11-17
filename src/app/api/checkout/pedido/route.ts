import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { resolverPrecios } from "@/lib/pricing-server";
import { firmarIntegridad } from "@/lib/wompi/integrity";

type ItemIn = {
  slug?: string;
  nombre?: string;
  precio?: number;
  cantidad?: number;
  talla?: string | null;
  colorHilo?: string | null;
  colorHiloHex?: string | null;
  observaciones?: string;
  linea?: string;
  lineaId?: string;
  imagen?: string;
  coleccion?: string | null;
};

type DatosIn = {
  nombre?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  barrio?: string;
  ciudad?: string;
  departamento?: string;
  codigoPostal?: string;
  notas?: string;
};

export async function POST(req: Request) {
  let body: {
    numero_pedido?: string;
    items?: ItemIn[];
    datos?: DatosIn;
    ambiente?: string;
    codigo_descuento?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const numero_pedido = String(body.numero_pedido || "").trim();
  const itemsRaw = Array.isArray(body.items) ? body.items : [];
  const datos = body.datos && typeof body.datos === "object" ? body.datos : {};
  const ambiente = String(body.ambiente || "").trim() || null;
  const codigo_descuento = body.codigo_descuento ? String(body.codigo_descuento).trim().toUpperCase() : null;

  if (!numero_pedido || !itemsRaw.length) {
    return NextResponse.json(
      { error: "missing_params", required: ["numero_pedido", "items"] },
      { status: 400 }
    );
  }

  const cliente_nombre = String(datos.nombre || "").trim() || null;
  const cliente_email = String(datos.email || "").trim().toLowerCase() || null;
  const cliente_telefono = String(datos.telefono || "").trim() || null;

  // El precio (y por lo tanto el total) lo decide el servidor leyendo la base de datos.
  const lineas = itemsRaw
    .map((item) => ({
      ...item,
      slug: String(item.slug ?? "").trim(),
      cantidad: Number(item.cantidad) || 0,
    }))
    .filter((item) => item.slug.length > 0);

  // Resolver precios con código de descuento si se proporciona
  const resuelto = await resolverPrecios(lineas, codigo_descuento || undefined);

  if (!resuelto.ok) {
    if (resuelto.error === "producto_no_disponible") {
      return NextResponse.json(
        { error: "producto_no_disponible", slug: resuelto.slug ?? null },
        { status: 409 }
      );
    }
    if (resuelto.error === "codigo_invalido") {
      return NextResponse.json(
        { error: "codigo_invalido", detail: resuelto.detail },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: resuelto.error }, { status: 400 });
  }

  const total_cop = resuelto.total;
  const amountInCents = resuelto.amountInCents;

  const signature = firmarIntegridad({
    reference: numero_pedido,
    amountInCents,
    currency: "COP",
  });

  if (!signature) {
    console.error("[checkout/pedido] WOMPI_INTEGRITY_SECRET no configurado");
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  // Conservamos los campos que agrega el cliente (imagen, observaciones, etc.)
  // pero con el precio y la cantidad validados por el servidor.
  const items = lineas.map((item, idx) => {
    const resueltoItem = resuelto.items[idx];
    return {
      ...item,
      nombre: resueltoItem?.nombre || item.nombre,
      precio: resueltoItem?.precio ?? 0,
      precioOriginal: resueltoItem?.precioOriginal,
      descuento: resueltoItem?.descuento,
      cantidad: resueltoItem?.cantidad ?? item.cantidad,
    };
  });

  // Evitar duplicados si el cliente reintenta, sin sobrescribir el estado del
  // pedido que ya haya gestionado el admin (estado_envio, pago, postpago).
  const { data: existing } = await supabaseAdmin
    .from("pedidos")
    .select("id")
    .eq("numero_pedido", numero_pedido)
    .maybeSingle();

  let pedidoId: string;

  if (existing) {
    const { error } = await supabaseAdmin
      .from("pedidos")
      .update({
        cliente_nombre,
        cliente_email,
        cliente_telefono,
        direccion_envio: datos,
        items,
        total_cop,
        codigo_descuento_usado: codigo_descuento,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) {
      console.error("[checkout/pedido] update error", error.message, numero_pedido);
      return NextResponse.json({ error: "db_error", detail: error.message }, { status: 500 });
    }
    pedidoId = existing.id;
  } else {
    const { data, error } = await supabaseAdmin
      .from("pedidos")
      .insert({
        numero_pedido,
        cliente_nombre,
        cliente_email,
        cliente_telefono,
        direccion_envio: datos,
        items,
        total_cop,
        codigo_descuento_usado: codigo_descuento,
        wompi_transaction_id: null,
        estado_pago: "PENDIENTE",
        metodo_pago: "web_checkout",
        ambiente,
        updated_at: new Date().toISOString(),
      })
      .select("id, numero_pedido")
      .maybeSingle();

    if (error) {
      console.error("[checkout/pedido] insert error", error.message, numero_pedido);
      return NextResponse.json({ error: "db_error", detail: error.message }, { status: 500 });
    }
    pedidoId = data!.id;
  }

  // Si se usó un código de descuento válido, crear registros de comisión para el embajador
  if (resuelto.codigoAplicado && resuelto.descuentoTotal && resuelto.descuentoTotal > 0) {
    try {
      // Obtener info del código y embajador
      const { data: codigoData } = await supabaseAdmin
        .from("codigos_descuento")
        .select("id, embajador_id, porcentaje_descuento")
        .eq("codigo", resuelto.codigoAplicado)
        .maybeSingle();

      if (codigoData && codigoData.embajador_id) {
        const embajadorId = codigoData.embajador_id;
        const porcentajeComision = 10; // 10% fijo sobre el total con descuento
        const comisionMonto = Math.round(total_cop * (porcentajeComision / 100));

        // Crear registro de comisión por cada item (para auditoría detallada)
        for (const item of resuelto.items) {
          if (item.descuento && item.descuento > 0) {
            const subtotalItem = (item.precioOriginal ?? item.precio) * item.cantidad;
            const descuentoItem = item.descuento * item.cantidad;
            const totalConDescuentoItem = item.precio * item.cantidad;
            const comisionItem = Math.round(totalConDescuentoItem * (porcentajeComision / 100));

            await supabaseAdmin.from("comisiones_embajador").insert({
              embajador_id: embajadorId,
              pedido_id: pedidoId,
              codigo_usado: resuelto.codigoAplicado,
              subtotal_productos: subtotalItem,
              descuento_aplicado: descuentoItem,
              total_con_descuento: totalConDescuentoItem,
              comision_porcentaje: porcentajeComision,
              comision_monto: comisionItem,
              estado: "pendiente",
            });
          }
        }

        // Actualizar contador de usos del código
        await supabaseAdmin.rpc("incrementar_usos_codigo", { codigo_param: resuelto.codigoAplicado });

        // Actualizar comisión pendiente del embajador
        await supabaseAdmin.rpc("sumar_comision_pendiente", { embajador_id_param: embajadorId, monto_param: comisionMonto });
      }
    } catch (comisionError) {
      console.error("[checkout/pedido] Error creando comisiones:", comisionError);
      // No fallar el pedido si hay error en comisiones, solo logear
    }
  }

  return NextResponse.json(
    { ok: true, pedido: { id: pedidoId, numero_pedido }, total: total_cop, amountInCents, signature },
    { status: 200 }
  );
}