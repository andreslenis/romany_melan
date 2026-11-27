-- Migración: Agregar porcentaje de comisión configurable por código de descuento
-- Fecha: 2026-11-27

alter table if exists codigos_descuento add column if not exists porcentaje_comision numeric default 10;

-- Backfill: asegurar que códigos existentes tengan un valor explícito
update codigos_descuento
set porcentaje_comision = 10
where porcentaje_comision is null;

create index if not exists idx_codigos_descuento_comision on codigos_descuento(porcentaje_comision);
