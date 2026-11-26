-- Campos de banner para el carrusel del inicio por colección.
-- banner_activo: la colección aparece como slide del carrusel (requiere ademas modo_acceso = 'activa').
-- banner_foto_url: foto del banner, independiente de foto_url (foto de la card).
alter table colecciones add column if not exists banner_activo boolean not null default false;
alter table colecciones add column if not exists banner_foto_url text;