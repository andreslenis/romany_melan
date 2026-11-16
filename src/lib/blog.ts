import { createClientServer } from "@/lib/supabase/server";

export interface BlogCta {
  etiqueta: string;
  href: string;
  descripcion?: string;
}

export interface BlogFrontmatter {
  title: string;
  description: string;
  date: string;
  updated?: string;
  author?: string;
  categoria?: string;
  cover?: string;
  coverAlt?: string;
  cta?: BlogCta[];
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
  content: string;
}

interface BlogRow {
  slug: string;
  titulo: string;
  resumen: string;
  contenido: string;
  portada?: string | null;
  portada_alt?: string | null;
  cta_texto?: string | null;
  cta_url?: string | null;
  categoria?: string | null;
  publicado?: boolean | null;
  fecha_publicacion?: string | null;
  updated_at?: string | null;
}

const AUTOR = "Romany Melan";

function mapRow(row: BlogRow): BlogPost {
  const cta: BlogCta[] = [];
  const etiqueta = row.cta_texto?.trim();
  const href = row.cta_url?.trim();

  if (etiqueta && href) {
    cta.push({ etiqueta, href });
  }

  return {
    slug: row.slug,
    content: row.contenido || "",
    frontmatter: {
      title: row.titulo,
      description: row.resumen,
      date: row.fecha_publicacion || new Date().toISOString().slice(0, 10),
      updated: row.updated_at ? row.updated_at.slice(0, 10) : undefined,
      author: AUTOR,
      categoria: row.categoria || undefined,
      cover: row.portada || undefined,
      coverAlt: row.portada_alt || row.titulo,
      cta,
    },
  };
}

/** Entradas publicadas, de la más reciente a la más antigua. */
export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    const supabase = createClientServer();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("publicado", true)
      .order("fecha_publicacion", { ascending: false });

    if (error) {
      console.error("[blog] getAllPosts", error.message);
      return [];
    }

    return (data || []).map((row) => mapRow(row as BlogRow));
  } catch (error) {
    console.error("[blog] getAllPosts", error);
    return [];
  }
}

/** Entrada publicada por slug. */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = createClientServer();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("publicado", true)
      .maybeSingle();

    if (error) {
      console.error("[blog] getPostBySlug", error.message);
      return null;
    }

    return data ? mapRow(data as BlogRow) : null;
  } catch (error) {
    console.error("[blog] getPostBySlug", error);
    return null;
  }
}

/** Slugs publicados (para generateStaticParams). */
export async function getBlogSlugs(): Promise<string[]> {
  try {
    const supabase = createClientServer();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug")
      .eq("publicado", true);

    if (error) {
      console.error("[blog] getBlogSlugs", error.message);
      return [];
    }

    return (data || []).map((row) => String(row.slug));
  } catch (error) {
    console.error("[blog] getBlogSlugs", error);
    return [];
  }
}