-- Romany Melan schema
create table if not exists colecciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  acento_color_hex text,
  gema_principal text,
  relato_poetico text,
  activa boolean default true
);

do $$ begin
  create type linea_enum as enum ('ORIGEN','SINGULAR');
exception when duplicate_object then null;
end $$;

create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  coleccion_id uuid references colecciones(id),
  nombre text not null,
  slug text unique,
  descripcion_corta text,
  historia_narrativa text,
  linea linea_enum,
  precio_cop numeric,
  admite_color_hilo boolean default false,
  stock_disponible integer default 0,
  imagenes jsonb default '[]'::jsonb,
  activo boolean default true,
  especificaciones jsonb,
  tallas jsonb,
  badge text,
  modo_acceso text,
  insignia text
);

do $$ begin
  create type estado_pago_enum as enum ('PENDIENTE','APROBADO','RECHAZADO');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type estado_envio_enum as enum ('EN_PREPARACION','ENVIADO','ENTREGADO');
exception when duplicate_object then null;
end $$;

create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  numero_pedido text unique,
  cliente_nombre text,
  cliente_email text,
  cliente_telefono text,
  direccion_envio jsonb,
  items jsonb,
  total_cop numeric,
  wompi_transaction_id text,
  estado_pago estado_pago_enum default 'PENDIENTE',
  estado_envio estado_envio_enum default 'EN_PREPARACION',
  guia_rastreo text,
  created_at timestamptz default now()
);

create table if not exists perfiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nombre text,
  email text,
  telefono text,
  miembro boolean default false,
  proveedor text,
  created_at timestamptz default now()
);

-- RLS policies
alter table colecciones enable row level security;
alter table productos enable row level security;
alter table pedidos enable row level security;
alter table perfiles enable row level security;

do $$ begin create policy "anon_all_colecciones" on colecciones for all to anon using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "anon_all_productos" on productos for all to anon using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "anon_all_pedidos" on pedidos for all to anon using (true) with check (true); exception when duplicate_object then null; end $$;
do $$ begin create policy "anon_all_perfiles" on perfiles for all to anon using (true) with check (true); exception when duplicate_object then null; end $$;
insert into storage.buckets (id, name, public) values ('productos', 'productos', true) on conflict (id) do nothing;
do $$ begin create policy "anon_storage_productos" on storage.objects for all to anon using (bucket_id = 'productos') with check (bucket_id = 'productos'); exception when duplicate_object then null; end $$;

alter table pedidos add column if not exists transportadora text;
