-- Orden de colecciones en el inicio (menor = primero).
alter table colecciones add column if not exists orden integer not null default 0;
create index if not exists colecciones_orden_idx on colecciones (orden, nombre);

-- Seed: Soberbia primero.
update colecciones set orden = 1 where lower(nombre) = 'soberbia';