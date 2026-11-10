-- Extiende tabla colecciones con campos para sistema dinámico
alter table colecciones add column if not exists slug text unique;
alter table colecciones add column if not exists descripcion text;
alter table colecciones add column if not exists foto_url text;
alter table colecciones add column if not exists texto_boton text;
alter table colecciones add column if not exists descripcion_larga text;
alter table colecciones add column if not exists lema text;
alter table colecciones add column if not exists modo_acceso text default 'activa';

-- Bucket storage público para fotos de colecciones
insert into storage.buckets (id, name, public) values ('colecciones', 'colecciones', true) on conflict (id) do nothing;

do $$ begin create policy "auth_storage_colecciones" on storage.objects for all to authenticated using (bucket_id = 'colecciones') with check (bucket_id = 'colecciones'); exception when duplicate_object then null; end $$;
do $$ begin create policy "anon_read_colecciones" on storage.objects for select to anon using (bucket_id = 'colecciones'); exception when duplicate_object then null; end $$;

-- Seed: poblar slugs y campos nuevos para las 7 colecciones pecados existentes (si existen)
update colecciones set slug = 'soberbia', modo_acceso = 'activa', lema = 'El brillo de quien se reconoce.', texto_boton = 'Descubrir el Brillo de Soberbia', descripcion_larga = 'La elevación del ser y el brillo de la Amatista. Colección Soberbia en Línea Origen, Oro Laminado 18K & Gema Natural.' where lower(nombre) = 'soberbia';
