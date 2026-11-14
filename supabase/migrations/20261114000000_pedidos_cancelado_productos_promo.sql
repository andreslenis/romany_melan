-- Pedidos: cuarto estado de envio CANCELADO.
-- ALTER TYPE ADD VALUE no puede ir dentro de un bloque de transaccion.
ALTER TYPE estado_envio_enum ADD VALUE IF NOT EXISTS 'CANCELADO';

-- Productos: precio de promocion opcional (toggle explicito para poder desactivarlo sin perder el valor).
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS precio_promo numeric,
  ADD COLUMN IF NOT EXISTS promo_activa boolean DEFAULT false;

ALTER TABLE public.productos
  DROP CONSTRAINT IF EXISTS precio_promo_check;

ALTER TABLE public.productos
  ADD CONSTRAINT precio_promo_check CHECK (precio_promo IS NULL OR precio_promo > 0);

-- Indice para localizar el pedido por referencia desde los endpoints admin.
CREATE INDEX IF NOT EXISTS idx_pedidos_numero_pedido
  ON public.pedidos (numero_pedido);