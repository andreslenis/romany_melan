-- Lectura pública de colecciones para el renderizado en servidor (SSR/SSG)
-- y para los visitantes sin sesión. La tabla tiene RLS activo y solo una
-- política para el rol authenticated (schema.sql), por lo que el rol anon
-- (usado por createClientServer con la anon key) recibía 0 filas.
DROP POLICY IF EXISTS "anon_read_colecciones" ON public.colecciones;
CREATE POLICY "anon_read_colecciones"
  ON public.colecciones
  FOR SELECT
  TO anon
  USING (true);