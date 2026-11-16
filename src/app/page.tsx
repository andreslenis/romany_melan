import HomeClient from "@/components/home/HomeClient";
import { getColeccionesPublicas, getProductosDestacados } from "@/lib/supabase/queries";

export const revalidate = 3600;

export default async function Home() {
  const [colecciones, productosDestacados] = await Promise.all([
    getColeccionesPublicas(),
    getProductosDestacados(8),
  ]);

  return <HomeClient colecciones={colecciones} productosDestacados={productosDestacados} />;
}