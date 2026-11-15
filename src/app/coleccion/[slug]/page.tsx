import type { Metadata } from "next";
import { notFound } from "next/navigation";

import CollectionClient from "./CollectionClient";
import {
  getColeccionPorSlug,
  getColeccionesActivas,
  getProductosPorColeccion,
  type ProductoDB,
} from "@/lib/supabase/queries";

export const revalidate = 3600;

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const colecciones = await getColeccionesActivas();
  return colecciones
    .filter((c) => Boolean(c.slug))
    .map((c) => ({ slug: String(c.slug) }));
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const coleccion = await getColeccionPorSlug(slug);

  if (!coleccion) {
    return {
      title: "Colección no encontrada",
      description:
        "Explora las colecciones de joyería artesanal de autor de Romany Melan.",
    };
  }

  const nombre = coleccion.nombre || slug;
  const descripcion =
    coleccion.descripcion_larga ||
    coleccion.lema ||
    `Colección ${nombre} de Romany Melan: joyería artesanal de autor en Colombia, tejida a mano con micro macramé, metales nobles y piedras naturales.`;

  return {
    title: `Colección ${nombre}`,
    description: descripcion.slice(0, 160),
    alternates: {
      canonical: `/coleccion/${coleccion.slug || slug}`,
    },
    openGraph: {
      title: `Colección ${nombre} | Romany Melan`,
      description: descripcion.slice(0, 160),
      url: `/coleccion/${coleccion.slug || slug}`,
      images: coleccion.foto_url ? [{ url: coleccion.foto_url }] : undefined,
    },
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const coleccion = await getColeccionPorSlug(slug);

  if (!coleccion) {
    notFound();
  }

  const productos =
    coleccion.id != null
      ? ((await getProductosPorColeccion(coleccion.id)) as ProductoDB[])
      : [];

  return (
    <CollectionClient
      coleccion={coleccion}
      productos={productos}
      slug={slug}
    />
  );
}