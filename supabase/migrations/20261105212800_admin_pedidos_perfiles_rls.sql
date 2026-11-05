-- Defensa en profundidad: revoca acceso anon (PII) a pedidos/perfiles.
-- Acceso admin se realiza via rutas /api/admin/* con service_role + verificación en tabla admins.
-- Flujos públicos (checkout/respuesta) ya usan server/service_role.

DROP POLICY IF EXISTS "anon_all_pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "anon_all_perfiles" ON public.perfiles;
