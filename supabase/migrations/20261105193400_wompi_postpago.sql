-- Wompi post-pago: columnas faltantes, estado ERROR, idempotencia stock/CRM
-- Ejecutar en Supabase (SQL editor) o via supabase db push. ALTER TYPE ADD VALUE no puede ir en transacción.

ALTER TYPE estado_pago_enum ADD VALUE IF NOT EXISTS 'ERROR';

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS wompi_status text,
  ADD COLUMN IF NOT EXISTS metodo_pago text,
  ADD COLUMN IF NOT EXISTS ambiente text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS transportadora text,
  ADD COLUMN IF NOT EXISTS post_pago_procesado_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_pedidos_wompi_transaction_id
  ON public.pedidos (wompi_transaction_id)
  WHERE wompi_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pedidos_estado_pago
  ON public.pedidos (estado_pago);
