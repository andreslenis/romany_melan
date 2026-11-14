import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

type ItemIn = {
  slug?: string;
  nombre?: string;
  precio?: number;
  cantidad?: number;
  talla?: string | null;
  colorHilo?: string | null;
  observaciones?: string;
  linea?: string;
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
    total_cop?: number;
    ambiente?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const numero_pedido = String(body.numero_pedido || "").trim();
  const items = Array.isArray(body.items) ? body.items : [];
  const datos = body.datos && typeof body.datos === "object" ? body.datos : {};
  const total_cop = Number(body.total_cop);

  if (!numero_pedido || !items.length || !Number.isFinite(total_cop)) {
    return NextResponse.json(
      { error: "missing_params", required: ["numero_pedido", "items", "total_cop"] },
      { status: 400 }
    );
  }

  const cliente_nombre = String(datos.nombre || "").trim() || null;
  const cliente_email = String(datos.email || "").trim().toLowerCase() || null;
  const cliente_telefono = String(datos.telefono || "").trim() || null;
const ambiente = String(body.ambiente || "").trim() || null;

  // Evitar duplicados si el cliente reintenta, sin sobrescribir el estado del
  // pedido que ya haya gestionado el admin (estado_envio, pago, postpago).
  const { data: existing } = await supabaseAdmin
    .from("pedidos")
    .select("id")
    .eq("numero_pedido", numero_pedido)
    .maybeSingle();

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
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) {
      console.error("[checkout/pedido] update error", error.message, numero_pedido);
      return NextResponse.json({ error: "db_error", detail: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, pedido: { id: existing.id, numero_pedido } }, { status: 200 });
  }

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

  return NextResponse.json({ ok: true, pedido: data }, { status: 200 });
}
