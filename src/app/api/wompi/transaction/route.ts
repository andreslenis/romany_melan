import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fetchWompiTransaction, mapWompiStatus } from "@/lib/wompi/server";
import { applyWompiTransactionToPedido } from "@/lib/wompi/postpago";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = String(searchParams.get("id") || "").trim();
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  // Fuente autoritativa: Wompi. Si falla (sin red/token), caemos a DB.
  let tx = null as Awaited<ReturnType<typeof fetchWompiTransaction>>;
  try {
    tx = await fetchWompiTransaction(id);
  } catch (e) {
    console.error("[wompi/transaction] fetch error", e);
  }

  if (tx && tx.reference) {
    const applied = await applyWompiTransactionToPedido(supabaseAdmin, {
      id: tx.id,
      status: tx.status,
      reference: tx.reference,
    });
    const { data: pedido } = await supabaseAdmin
      .from("pedidos")
      .select("numero_pedido, estado_pago, wompi_status, wompi_transaction_id, total_cop")
      .eq("numero_pedido", tx.reference)
      .maybeSingle();
    return NextResponse.json(
      {
        ok: true,
        source: "wompi",
        transaction: tx,
        estadoPago: pedido?.estado_pago ?? mapWompiStatus(tx.status),
        pedido: pedido ?? null,
        applied: { ok: applied.ok, postPagoProcesado: applied.postPagoProcesado ?? false },
      },
      { status: 200 }
    );
  }

  // Fallback: buscar pedido por transaction id o referencia local.
  const { data: pedido } = await supabaseAdmin
    .from("pedidos")
    .select("numero_pedido, estado_pago, wompi_status, wompi_transaction_id, total_cop")
    .or(`wompi_transaction_id.eq.${id},numero_pedido.eq.${id}`)
    .maybeSingle();

  if (!pedido) {
    return NextResponse.json(
      { ok: false, source: "db", error: "not_found", pending: true },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      source: "db",
      transaction: tx,
      estadoPago: pedido.estado_pago,
      pedido,
    },
    { status: 200 }
  );
}
