-- Migración: Sistema de Embajadores y Códigos de Descuento
-- Fecha: 2026-11-17

-- Agregar columna codigo_descuento_usado a pedidos si no existe
alter table if exists pedidos add column if not exists codigo_descuento_usado text;

-- Tabla de embajadores
create table if not exists embajadores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text not null,
  codigo text unique not null,
  activo boolean default true,
  comision_acumulada numeric default 0,
  comision_pendiente numeric default 0,
  ultima_liquidacion timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabla de códigos de descuento (vinculados a embajador)
create table if not exists codigos_descuento (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  embajador_id uuid references embajadores(id) on delete cascade,
  porcentaje_descuento numeric default 5, -- 5% fijo por requerimiento
  activo boolean default true,
  usos_totales integer default 0,
  created_at timestamptz default now()
);

-- Tabla de comisiones por pedido (detalle para auditoría)
create table if not exists comisiones_embajador (
  id uuid primary key default gen_random_uuid(),
  embajador_id uuid references embajadores(id) on delete cascade,
  pedido_id uuid references pedidos(id) on delete cascade,
  codigo_usado text not null,
  subtotal_productos numeric not null,
  descuento_aplicado numeric not null,
  total_con_descuento numeric not null,
  comision_porcentaje numeric default 10, -- 10% fijo
  comision_monto numeric not null,
  estado text default 'pendiente', -- pendiente, confirmada, pagada
  created_at timestamptz default now()
);

-- Índices para consultas frecuentes
create index if not exists idx_codigos_descuento_codigo on codigos_descuento(codigo);
create index if not exists idx_codigos_descuento_embajador on codigos_descuento(embajador_id);
create index if not exists idx_comisiones_embajador_estado on comisiones_embajador(estado);
create index if not exists idx_comisiones_embajador_pedido on comisiones_embajador(pedido_id);
create index if not exists idx_comisiones_embajador_embajador on comisiones_embajador(embajador_id);

-- RLS Policies
alter table embajadores enable row level security;
alter table codigos_descuento enable row level security;
alter table comisiones_embajador enable row level security;

-- Solo admins (service_role) pueden acceder a estas tablas
-- No hay políticas para anon/authenticated; acceso vía service_role en rutas server

-- Trigger para updated_at en embajadores
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_embajadores_updated_at on embajadores;
create trigger update_embajadores_updated_at
  before update on embajadores
  for each row execute function update_updated_at_column();

-- RPC: Incrementar usos de un código de descuento
create or replace function incrementar_usos_codigo(codigo_param text)
returns void as $$
begin
  update codigos_descuento
  set usos_totales = usos_totales + 1
  where codigo = codigo_param;
end;
$$ language plpgsql security definer;

-- RPC: Sumar comisión pendiente a un embajador
create or replace function sumar_comision_pendiente(embajador_id_param uuid, monto_param numeric)
returns void as $$
begin
  update embajadores
  set comision_pendiente = comision_pendiente + monto_param
  where id = embajador_id_param;
end;
$$ language plpgsql security definer;

-- RPC: Marcar comisiones como pagadas (liquidar)
create or replace function liquidar_comisiones_embajador(embajador_id_param uuid)
returns void as $$
declare
  v_comision_pendiente numeric;
begin
  -- Obtener comisión pendiente actual
  select comision_pendiente into v_comision_pendiente
  from embajadores
  where id = embajador_id_param;

  if v_comision_pendiente > 0 then
    -- Mover de pendiente a acumulada
    update embajadores
    set comision_acumulada = comision_acumulada + v_comision_pendiente,
        comision_pendiente = 0,
        ultima_liquidacion = now()
    where id = embajador_id_param;

    -- Marcar comisiones pendientes como pagadas
    update comisiones_embajador
    set estado = 'pagada'
    where embajador_id = embajador_id_param
      and estado = 'pendiente';
  end if;
end;
$$ language plpgsql security definer;

-- RPC: Confirmar comisión cuando se aprueba el pago (webhook)
create or replace function confirmar_comision_pedido(pedido_id_param uuid)
returns void as $$
begin
  update comisiones_embajador
  set estado = 'confirmada'
  where pedido_id = pedido_id_param
    and estado = 'pendiente';
end;
$$ language plpgsql security definer;