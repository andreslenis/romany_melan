import type { SupabaseClient } from "@supabase/supabase-js";
import { mapWompiStatus } from "./server";
import { sendOrderConfirmationEmail } from "@/lib/email/send-order-confirmation";

type PedidoRow = {
  id: string;
  numero_pedido: string | null;
  items: unknown;
  cliente_nombre: string | null;
  cliente_email: string | null;
  cliente_telefono: string | null;
  estado_pago: string | null;
  post_pago_procesado_at: string | null;
};

type Item = {
  slug?: string;
  cantidad?: number | string;
};

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const e = String(email).trim().toLowerCase();
  return e.length ? e : null;
}

async function descontarStock(supabase: SupabaseClient, items: unknown): Promise<void> {
  if (!Array.isArray(items)) return;
  for (const raw of items as Item[]) {
    const slug = typeof raw?.slug === "string" ? raw.slug : null;
    const cantidad = Math.max(0, Number(raw?.cantidad) || 0);
    if (!slug || cantidad <= 0) continue;
    const { data: producto, error: selErr } = await supabase
      .from("productos")
      .select("id, stock_disponible")
      .eq("slug", slug)
      .maybeSingle();
    if (selErr) {
      console.error("[wompi/postpago] stock select error", slug, selErr.message);
      continue;
    }
    if (!producto) {
      console.warn("[wompi/postpago] producto no encontrado para slug", slug);
      continue;
    }
    const actual = Number(producto.stock_disponible) || 0;
    const nuevo = Math.max(0, actual - cantidad);
    const { error: upErr } = await supabase
      .from("productos")
      .update({ stock_disponible: nuevo })
      .eq("id", producto.id);
    if (upErr) {
      console.error("[wompi/postpago] stock update error", slug, upErr.message);
    }
  }
}

async function upsertCrmCliente(
  supabase: SupabaseClient,
  pedido: Pick<PedidoRow, "cliente_nombre" | "cliente_email" | "cliente_telefono">
): Promise<void> {
  const email = normalizeEmail(pedido.cliente_email);
  if (!email) return;
  const nombre = pedido.cliente_nombre?.trim() || null;
  const telefono = pedido.cliente_telefono?.trim() || null;
  const { data: existing, error: selErr } = await supabase
    .from("perfiles")
    .select("id, nombre, telefono")
    .eq("email", email)
    .maybeSingle();
  if (selErr) {
    console.error("[wompi/postpago] perfiles select error", selErr.message);
    return;
  }
  if (existing) {
    const patch: Record<string, unknown> = {};
    if (nombre && !existing.nombre) patch.nombre = nombre;
    if (telefono && !existing.telefono) patch.telefono = telefono;
    if (Object.keys(patch).length) {
      const { error: upErr } = await supabase
        .from("perfiles")
        .update(patch)
        .eq("id", existing.id);
      if (upErr) console.error("[wompi/postpago] perfiles update error", upErr.message);
    }
    return;
  }
  const { error: insErr } = await supabase.from("perfiles").insert({
    nombre: nombre || "Cliente",
    email,
    telefono: telefono || "",
    miembro: false,
    proveedor: "checkout",
  });
  if (insErr) {
    console.error("[wompi/postpago] perfiles insert error", insErr.message);
  }
}

export type ApplyTxResult = {
  ok: boolean;
  pedidoId?: string;
  estadoPago?: string;
  postPagoProcesado?: boolean;
  notFound?: boolean;
  error?: string;
};

/**
 * Actualiza estado de pago desde una transacción Wompi y, si queda APROBADO,
 * ejecuta efectos post-pago (stock + CRM) de forma idempotente usando
 * post_pago_procesado_at como marca atómica.
 */
export async function applyWompiTransactionToPedido(
  supabase: SupabaseClient,
  tx: { id: string; status: string; reference: string }
): Promise<ApplyTxResult> {
  const reference = String(tx.reference || "").trim();
  const transactionId = String(tx.id || "").trim();
  const wompiStatus = String(tx.status || "").toUpperCase();
  const estadoPago = mapWompiStatus(wompiStatus);
  if (!reference) return { ok: false, error: "missing_reference" };

  const now = new Date().toISOString();

  const { data: pedido, error: findErr } = await supabase
    .from("pedidos")
    .select(
      "id, numero_pedido, items, cliente_nombre, cliente_email, cliente_telefono, estado_pago, post_pago_procesado_at"
    )
    .eq("numero_pedido", reference)
    .maybeSingle();

  if (findErr) {
    console.error("[wompi/postpago] find pedido error", findErr.message);
    return { ok: false, error: "db_find_failed" };
  }
  if (!pedido) {
    console.warn("[wompi/postpago] pedido no encontrado para reference", reference);
    return { ok: false, notFound: true, error: "pedido_not_found" };
  }

  const row = pedido as PedidoRow;

  const { error: updErr } = await supabase
    .from("pedidos")
    .update({
      estado_pago: estadoPago,
      wompi_transaction_id: transactionId || null,
      wompi_status: wompiStatus,
      updated_at: now,
    })
    .eq("id", row.id);

  if (updErr) {
    console.error("[wompi/postpago] update pedido error", updErr.message);
    return { ok: false, pedidoId: row.id, error: "db_update_failed" };
  }

  if (estadoPago !== "APROBADO") {
    return { ok: true, pedidoId: row.id, estadoPago, postPagoProcesado: false };
  }

  // Idempotencia: solo el primer proceso que marque post_pago_procesado_at ejecuta efectos.
  const { data: claimed, error: claimErr } = await supabase
    .from("pedidos")
    .update({ post_pago_procesado_at: now, updated_at: now })
    .eq("id", row.id)
    .is("post_pago_procesado_at", null)
    .select("id")
    .maybeSingle();

  if (claimErr) {
    console.error("[wompi/postpago] claim error", claimErr.message);
    return { ok: false, pedidoId: row.id, estadoPago, error: "claim_failed" };
  }
  if (!claimed) {
    return { ok: true, pedidoId: row.id, estadoPago, postPagoProcesado: true };
  }

  try {
    await descontarStock(supabase, row.items);
  } catch (e) {
    console.error("[wompi/postpago] descontarStock exception", e);
  }
  try {
    await upsertCrmCliente(supabase, row);
  } catch (e) {
    console.error("[wompi/postpago] upsertCrmCliente exception", e);
  }

  // Enviar correo de confirmación de pedido (best-effort, no bloquea el flujo).
  try {
    const email = normalizeEmail(row.cliente_email);
    const nombre = row.cliente_nombre?.trim() || "Cliente";
    const referencia = row.numero_pedido ?? "";
    if (email) {
      await sendOrderConfirmationEmail({ email, nombre, referencia });
    }
  } catch (e) {
    console.error("[wompi/postpago] sendOrderConfirmationEmail exception", e);
  }

  return { ok: true, pedidoId: row.id, estadoPago, postPagoProcesado: true };
}
