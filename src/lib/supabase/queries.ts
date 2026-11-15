import { createClientServer } from "@/lib/supabase/server";
import type { Coleccion } from "@/lib/types";

export interface ProductoDB {
  id: string;
  slug: string;
  nombre: string;
  linea: string;
  precio_cop?: number | null;
  precio_promo?: number | null;
  promo_activa?: boolean | null;
  precioFormato?: string;
  material?: string;
  categoria?: string;
  badge?: string;
  narrativa?: string;
  descripcion_corta?: string;
  historia_narrativa?: string;
  especificaciones?: {
    material?: string;
    componentes?: string;
    piedra?: string;
  };
  tallas?: (string | number)[];
  imagen?: string;
  imagenes?: string[];
  colorHilo?: string;
  colores_hilo?: string[] | string;
  modoAcceso?: string;
  insignia?: string;
  grupo?: string;
  coleccion_id?: string;
  imagenes_por_color?: Record<string, string>;
  imagenesPorColor?: Record<string, string>;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Colecciones visibles en el inicio (todo menos las inactivas). */
export async function getColeccionesPublicas(): Promise<Coleccion[]> {
  try {
    const supabase = createClientServer();
    const { data, error } = await supabase
      .from("colecciones")
      .select("*")
      .neq("modo_acceso", "inactiva")
      .order("nombre");

    if (error) {
      console.error("[queries] getColeccionesPublicas", error.message);
      return [];
    }
    return (data || []) as Coleccion[];
  } catch (error) {
    console.error("[queries] getColeccionesPublicas", error);
    return [];
  }
}

/** Colecciones activas (para sitemap y navegación). */
export async function getColeccionesActivas(): Promise<Coleccion[]> {
  try {
    const supabase = createClientServer();
    const { data, error } = await supabase
      .from("colecciones")
      .select("*")
      .eq("modo_acceso", "activa")
      .order("nombre");

    if (error) {
      console.error("[queries] getColeccionesActivas", error.message);
      return [];
    }
    return (data || []) as Coleccion[];
  } catch (error) {
    console.error("[queries] getColeccionesActivas", error);
    return [];
  }
}

/** Colección por slug, con respaldo por nombre. */
export async function getColeccionPorSlug(
  slug: string
): Promise<Coleccion | null> {
  try {
    const supabase = createClientServer();
    const { data: bySlug } = await supabase
      .from("colecciones")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (bySlug) return bySlug as Coleccion;

    const { data: cols } = await supabase.from("colecciones").select("*");
    const match = (cols || []).find(
      (x: Coleccion) =>
        String(x.slug || x.nombre).toLowerCase() === slug.toLowerCase()
    );
    return (match as Coleccion) || null;
  } catch (error) {
    console.error("[queries] getColeccionPorSlug", error);
    return null;
  }
}

/** Productos activos de una colección. */
export async function getProductosPorColeccion(
  coleccionId: string
): Promise<ProductoDB[]> {
  try {
    const supabase = createClientServer();
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .eq("coleccion_id", coleccionId)
      .eq("activo", true)
      .order("nombre");

    if (error) {
      console.error("[queries] getProductosPorColeccion", error.message);
      return [];
    }
    return (data || []) as ProductoDB[];
  } catch (error) {
    console.error("[queries] getProductosPorColeccion", error);
    return [];
  }
}

/** Producto por slug. */
export async function getProductoPorSlug(
  slug: string
): Promise<ProductoDB | null> {
  try {
    const supabase = createClientServer();
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("[queries] getProductoPorSlug", error.message);
      return null;
    }
    return (data as ProductoDB) || null;
  } catch (error) {
    console.error("[queries] getProductoPorSlug", error);
    return null;
  }
}

/** Variantes de un mismo grupo (misma pieza en distintos hilos). */
export async function getVariantesPorGrupo(
  grupo: string
): Promise<ProductoDB[]> {
  try {
    const supabase = createClientServer();
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .eq("grupo", grupo);

    if (error) {
      console.error("[queries] getVariantesPorGrupo", error.message);
      return [];
    }
    return (data || []) as ProductoDB[];
  } catch (error) {
    console.error("[queries] getVariantesPorGrupo", error);
    return [];
  }
}

/** Nombre de la colección de un producto. */
export async function getNombreColeccion(
  coleccionId?: string | null
): Promise<string | null> {
  if (!coleccionId) return null;
  try {
    const supabase = createClientServer();
    const { data, error } = await supabase
      .from("colecciones")
      .select("nombre, slug")
      .eq("id", coleccionId)
      .maybeSingle();

    if (error) {
      console.error("[queries] getNombreColeccion", error.message);
      return null;
    }
    if (!data || typeof data !== "object" || !("nombre" in data)) return null;
    return String(data.nombre);
  } catch (error) {
    console.error("[queries] getNombreColeccion", error);
    return null;
  }
}

/** Productos activos (para sitemap). */
export async function getProductosActivos(): Promise<ProductoDB[]> {
  try {
    const supabase = createClientServer();
    const { data, error } = await supabase
      .from("productos")
      .select("slug, nombre, coleccion_id")
      .eq("activo", true)
      .order("nombre");

    if (error) {
      console.error("[queries] getProductosActivos", error.message);
      return [];
    }
    return (data || []) as ProductoDB[];
  } catch (error) {
    console.error("[queries] getProductosActivos", error);
    return [];
  }
}