import { createClientServer } from "@/lib/supabase/server";

export interface ColorHilo {
  slug: string;
  nombre: string;
  hex: string;
  foto_url?: string | null;
  foto_alt?: string | null;
}

/** Colores de hilo activos del catálogo, ordenados. */
export async function getColoresHilo(): Promise<ColorHilo[]> {
  try {
    const supabase = createClientServer();
    const { data, error } = await supabase
      .from("colores_hilo")
      .select("slug, nombre, hex, foto_url, foto_alt")
      .eq("activo", true)
      .order("orden", { ascending: true })
      .order("nombre");

    if (error) {
      console.error("[colores] getColoresHilo", error.message);
      return [];
    }
    return (data || []) as ColorHilo[];
  } catch (error) {
    console.error("[colores] getColoresHilo", error);
    return [];
  }
}

/** Mapa slug -> color para resolver rápido en cliente. */
export function colorMapa(colores: ColorHilo[]): Record<string, ColorHilo> {
  const out: Record<string, ColorHilo> = {};
  for (const c of colores) {
    if (c && typeof c.slug === "string") {
      out[c.slug] = c;
    }
  }
  return out;
}