-- Roles de usuario: admin vs cliente.
-- admin@romanymelan.com es el único admin; el resto de perfiles son clientes.
alter table perfiles add column if not exists rol text not null default 'cliente';
alter table perfiles drop constraint if exists perfiles_rol_check;
alter table perfiles add constraint perfiles_rol_check check (rol in ('admin','cliente'));

-- El admin actual pasa a rol admin (si el perfil ya existe).
update perfiles set rol = 'admin' where lower(email) = 'admin@romanymelan.com';

create index if not exists perfiles_rol_idx on perfiles (rol);