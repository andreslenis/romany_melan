import HomeClient from "@/components/home/HomeClient";
import { getColeccionesPublicas } from "@/lib/supabase/queries";

export const revalidate = 3600;

export default async function Home() {
  const colecciones = await getColeccionesPublicas();

  return <HomeClient colecciones={colecciones} />;
}