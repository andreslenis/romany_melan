import type { MetadataRoute } from "next";

import { getAllPosts } from "@/lib/blog";
import {
  getColeccionesActivas,
  getProductosActivos,
} from "@/lib/supabase/queries";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [colecciones, productos, posts] = await Promise.all([
    getColeccionesActivas(),
    getProductosActivos(),
    getAllPosts(),
  ]);

  const now = new Date();

  const entradas: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  for (const coleccion of colecciones) {
    if (!coleccion.slug) continue;
    entradas.push({
      url: `${SITE_URL}/coleccion/${coleccion.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const producto of productos) {
    if (!producto.slug) continue;
    entradas.push({
      url: `${SITE_URL}/producto/${producto.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  for (const post of posts) {
    const fecha = post.frontmatter.updated || post.frontmatter.date;
    const lastModified = Number.isNaN(new Date(fecha).getTime())
      ? now
      : new Date(fecha);
    entradas.push({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entradas;
}