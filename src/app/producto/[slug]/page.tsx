import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProductoClient from "./ProductoClient";
import {
  getNombreColeccion,
  getProductoPorSlug,
  getProductosActivos,
  getProductosRelacionados,
  getVariantesPorGrupo,
  type ProductoDB,
} from "@/lib/supabase/queries";

export const revalidate = 3600;

interface ProductoPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const productos = await getProductosActivos();
  return productos
    .filter((p) => Boolean(p.slug))
    .map((p) => ({ slug: String(p.slug) }));
}

export async function generateMetadata({
  params,
}: ProductoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const producto = await getProductoPorSlug(slug);

  if (!producto) {
    return {
      title: "Producto no encontrado",
      description:
        "Descubre la joyería artesanal de autor de Romany Melan en Colombia.",
    };
  }

  const coleccionNombre = await getNombreColeccion(producto.coleccion_id);
  const titulo = coleccionNombre
    ? `${producto.nombre} Colección ${coleccionNombre}`
    : producto.nombre;

  const descripcion = (
    producto.descripcion_corta ||
    producto.historia_narrativa ||
    producto.narrativa ||
    `${producto.nombre}: joya artesanal de autor de Romany Melan, tejida a mano en micro macramé con metales nobles y piedras naturales en Colombia.`
  ).toString();

  const imagen =
    (Array.isArray(producto.imagenes) && producto.imagenes[0]) ||
    producto.imagen ||
    undefined;

  return {
    title: titulo,
    description: descripcion.slice(0, 160),
    alternates: {
      canonical: `/producto/${producto.slug}`,
    },
    openGraph: {
      type: "website",
      title: `${titulo} | Romany Melan`,
      description: descripcion.slice(0, 160),
      url: `/producto/${producto.slug}`,
      images: imagen ? [{ url: imagen }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${titulo} | Romany Melan`,
      description: descripcion.slice(0, 160),
      images: imagen ? [imagen] : undefined,
    },
  };
}

export default async function ProductoPage({ params }: ProductoPageProps) {
  const { slug } = await params;
  const producto = (await getProductoPorSlug(slug)) as ProductoDB | null;

  if (!producto) {
    notFound();
  }

  const variantes = producto.grupo
    ? await getVariantesPorGrupo(producto.grupo)
    : [producto];
  const coleccionNombre = await getNombreColeccion(producto.coleccion_id);
  const relacionados = await getProductosRelacionados({
    slugActual: producto.slug,
    grupoActual: producto.grupo,
    coleccionId: producto.coleccion_id,
    limite: 2,
  });

  return (
    <ProductoClient
      producto={producto}
      variantes={variantes}
      coleccionNombre={coleccionNombre}
      relacionados={relacionados}
    />
  );
}