export const SITE_NAME = "Romany Melan";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.romanymelan.com";

export const SITE_TITLE =
  "Romany Melan | Joyería de Autor en Colombia con Piedras Naturales";

export const SITE_DESCRIPTION =
  "Joyería artesanal de autor en Colombia. Descubre piezas únicas hechas a mano con micro macramé, metales nobles como oro y plata, y minerales naturales.";

export const HOME_H1 = SITE_TITLE;

export const HOME_H2 =
  "Historias tejidas a mano en micro macramé, metales nobles y mineralogía ancestral.";

export interface DatosAltProducto {
  nombre: string;
  material?: string | null;
  piedra?: string | null;
  coleccion?: string | null;
}

/** Recorta un texto a la longitud indicada sin cortar a mitad de palabra. */
function recortar(texto: string, maximo: number): string {
  const limpio = texto.trim().replace(/\s+/g, " ");
  if (limpio.length <= maximo) return limpio;
  const corte = limpio.slice(0, maximo);
  const ultimoEspacio = corte.lastIndexOf(" ");
  const base = ultimoEspacio > 0 ? corte.slice(0, ultimoEspacio) : corte;
  return base.replace(/[\s.,;:–—-]+$/, "");
}

/**
 * Construye un atributo alt descriptivo y con palabras clave para las
 * imágenes de producto renderizadas en la web.
 */
export function altProducto({
  nombre,
  material,
  piedra,
  coleccion,
}: DatosAltProducto): string {
  const nombreCorto = nombre?.trim();
  if (!nombreCorto) return `${SITE_NAME} · joyería artesanal`;

  const partes: string[] = [nombreCorto];

  const piedraCorta = piedra ? recortar(piedra, 46) : "";
  const materialCorto = material ? recortar(material, 46) : "";

  if (piedraCorta) partes.push(piedraCorta);
  if (materialCorto) partes.push(materialCorto);
  if (coleccion?.trim()) partes.push(`colección ${coleccion.trim()}`);

  const alt = `${partes.join(" · ")} · ${SITE_NAME}`;
  return alt.length > 170 ? `${alt.slice(0, 167).trim()}…` : alt;
}