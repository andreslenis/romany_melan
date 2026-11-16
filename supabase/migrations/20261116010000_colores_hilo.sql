-- Catálogo de colores de hilo editables por el admin.
-- slug es la clave estable usada en productos.colores_hilo e imagenes_por_color.
create table if not exists colores_hilo (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  hex text not null,
  foto_url text,
  foto_alt text,
  activo boolean not null default true,
  orden integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists colores_hilo_orden_idx on colores_hilo (orden, nombre);

alter table colores_hilo enable row level security;

drop policy if exists "anon_read_colores" on colores_hilo;
create policy "anon_read_colores" on colores_hilo for select to anon using (activo = true);

drop policy if exists "auth_all_colores" on colores_hilo;
create policy "auth_all_colores" on colores_hilo for all to authenticated using (true) with check (true);

-- Bucket público para fotos de colores.
insert into storage.buckets (id, name, public) values ('colores', 'colores', true) on conflict (id) do nothing;

do $$ begin create policy "auth_storage_colores" on storage.objects for all to authenticated using (bucket_id = 'colores') with check (bucket_id = 'colores'); exception when duplicate_object then null; end $$;
do $$ begin create policy "anon_read_colores_storage" on storage.objects for select to anon using (bucket_id = 'colores'); exception when duplicate_object then null; end $$;

-- Seed: replicar los 9 colores actuales de src/lib/pecados.ts (slugs estables).
insert into colores_hilo (slug, nombre, hex, activo, orden) values
  ('soberbia', 'Amatista', '#A882C1', true, 1),
  ('avaricia', 'Oro', '#D4AF37', true, 2),
  ('lujuria', 'Granate', '#8E2C48', true, 3),
  ('gula', 'Ámbar', '#C97B2C', true, 4),
  ('pereza', 'Azul Cian', '#2596be', true, 5),
  ('ira', 'Carmesí', '#B3261E', true, 6),
  ('envidia', 'Esmeralda', '#2E6B57', true, 7),
  ('oscuridad', 'Negro', '#111111', true, 8),
  ('luz', 'Blanco', '#F4F1E9', true, 9)
on conflict (slug) do nothing;