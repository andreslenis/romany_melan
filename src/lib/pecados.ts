import type { ColorHilo } from "./types";

export interface Pecado {
  numero: string;
  slug: string;
  titulo: string;
  subtitulo: string;
  imagen: string;
  color: ColorHilo;
}

/**
 * El orden sigue la numeración de los archivos en public/resources/Id_pecados
 * (1_soberbia, 2_avaricia, 3_lujuria, 4_gula, 5_pereza, 6_ira, 7_envidia).
 */
export const PECADOS: Pecado[] = [
  {
    numero: "I",
    slug: "soberbia",
    titulo: "Soberbia",
    subtitulo: "El brillo de quien se reconoce.",
    imagen: "/resources/Id_pecados/1_soberbia.jpg",
    color: {
      id: "soberbia",
      nombre: "Amatista",
      hex: "#A882C1",
      pecado: "Soberbia",
    },
  },
  {
    numero: "II",
    slug: "avaricia",
    titulo: "Avaricia",
    subtitulo: "El valor de lo esencial.",
    imagen: "/resources/Id_pecados/2_avaricia.jpg",
    color: {
      id: "avaricia",
      nombre: "Oro",
      hex: "#D4AF37",
      pecado: "Avaricia",
    },
  },
  {
    numero: "III",
    slug: "lujuria",
    titulo: "Lujuria",
    subtitulo: "El deseo que despierta.",
    imagen: "/resources/Id_pecados/3_lujuria.jpg",
    color: {
      id: "lujuria",
      nombre: "Granate",
      hex: "#8E2C48",
      pecado: "Lujuria",
    },
  },
  {
    numero: "IV",
    slug: "gula",
    titulo: "Gula",
    subtitulo: "El goce de saborear.",
    imagen: "/resources/Id_pecados/4_gula.jpg",
    color: {
      id: "gula",
      nombre: "Ámbar",
      hex: "#C97B2C",
      pecado: "Gula",
    },
  },
  {
    numero: "V",
    slug: "pereza",
    titulo: "Pereza",
    subtitulo: "La pausa que sana.",
    imagen: "/resources/Id_pecados/5_pereza.jpg",
    color: {
      id: "pereza",
      nombre: "Azul Cian",
      hex: "#2596be",
      pecado: "Pereza",
    },
  },
  {
    numero: "VI",
    slug: "ira",
    titulo: "Ira",
    subtitulo: "La fuerza que transforma.",
    imagen: "/resources/Id_pecados/6_ira.jpg",
    color: {
      id: "ira",
      nombre: "Carmesí",
      hex: "#B3261E",
      pecado: "Ira",
    },
  },
  {
    numero: "VII",
    slug: "envidia",
    titulo: "Envidia",
    subtitulo: "El eco que revela.",
    imagen: "/resources/Id_pecados/7_envidia.jpg",
    color: {
      id: "envidia",
      nombre: "Esmeralda",
      hex: "#2E6B57",
      pecado: "Envidia",
    },
  },
];

/**
 * Los siete pecados tienen un hilo propio y, además, la colección ofrece
 * dos tonos neutros que no pertenecen a ningún pecado: Oscuridad y Luz.
 */
export const COLORES_HILO: ColorHilo[] = [
  ...PECADOS.map((p) => p.color),
  {
    id: "oscuridad",
    nombre: "Negro",
    hex: "#111111",
    pecado: "Oscuridad",
  },
  {
    id: "luz",
    nombre: "Blanco",
    hex: "#F4F1E9",
    pecado: "Luz",
  },
];

export function colorPorId(id: string | null): ColorHilo | undefined {
  if (!id) return undefined;
  return COLORES_HILO.find((c) => c.id === id);
}
