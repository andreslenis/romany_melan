import type { MetadataRoute } from "next";

import {
  getColeccionesActivas,
  getProductosActivos,
} from "@/lib/supabase/queries";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [colecciones, productos] = await Promise.all([
    getColeccionesActivas(),
    getProductosActivos(),
  ]);

  const now = new Date();

  const entradas: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
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

  return entradas;
}