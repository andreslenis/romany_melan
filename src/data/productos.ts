import { COLORES_HILO } from "@/lib/pecados";
import { LINEAS, MATERIALES_LINEA, type Producto } from "@/lib/types";

const ORIGEN = "/resources/colecciones/soberbia/origen";
const SINGULAR = "/resources/colecciones/soberbia/singular";

/** Carpeta de origen (guiones bajos) de cada pieza de la línea Origen. */
const CARPETA_ANILLO_NUDO_SUTIL = "anillo_nudo_sutil";
const CARPETA_ARETES_GOTA_VIOLETA = "aretes_gota_violeta";
const CARPETA_PULSERA_LAZO_IMPERIAL = "pulsera_lazo_imperial";
const CARPETA_GARGANTILLA_SOBERBIA_SUTIL = "gargantilla_soberbia_sutil";
const CARPETA_COLLAR_DOBLE_CAPAS = "collar_doble_layering_capas_de_soberbia";

/**
 * Cada pieza de la línea Origen fue fotografiada en los nueve hilos de la
 * colección: los siete pecados más Oscuridad y Luz.
 */
function imagenesPorColor(carpeta: string): Record<string, string> {
  return Object.fromEntries(
    COLORES_HILO.map((color) => [
      color.id,
      `${ORIGEN}/${carpeta}/${carpeta}_${color.id}.jpg`,
    ])
  );
}

function imagenPrincipal(carpeta: string): string {
  return `${ORIGEN}/${carpeta}/${carpeta}_soberbia.jpg`;
}

const INSPECCIONES_ORIGEN = {
  material: "Hilo de poliamida de alta tenacidad en tejido micro-macramé.",
  componentes: "Oro Laminado 18K (Gold-Filled).",
  piedra: "Amatista natural pulida.",
};

const INSPECCIONES_SINGULAR = {
  material: "Hilo de seda de alta tenacidad en tejido micro-macramé a mano.",
  componentes: "Oro Macizo 18K (18K sólido).",
  piedra: "Gema de selección especial escogida por la autora.",
};

const NARRATIVA_ORIGEN =
  "La Soberbia no es imposición, es el reconocimiento silencioso de la propia dignidad. Cada nudo de esta línea celebra la altura que habita en lo delicado.";

const NARRATIVA_SINGULAR =
  "Obra invariable de edición limitada: el metal macizo se labra en frío y el hilo se teje a mano, nudo a nudo, sin posibilidad de serie.";

export const productosOrigen: Producto[] = [
  {
    slug: "anillo-nudo-sutil",
    nombre: "Anillo Nudo Sutil",
    linea: "origen",
    par: "anillo-nudo-imperial",
    precio: 107000,
    precioFormato: "$107.000 COP",
    material: MATERIALES_LINEA.origen,
    categoria: "soberbia",
    badge: "Oro Laminado 18K & Amatista Natural",
    narrativa: NARRATIVA_ORIGEN,
    especificaciones: INSPECCIONES_ORIGEN,
    tallas: [4, 5, 6, 7, 8],
    imagen: imagenPrincipal(CARPETA_ANILLO_NUDO_SUTIL),
    imagenes: Object.values(imagenesPorColor(CARPETA_ANILLO_NUDO_SUTIL)),
    imagenesPorColor: imagenesPorColor(CARPETA_ANILLO_NUDO_SUTIL),
    colorHilo: "soberbia",
    modoAcceso: "disponible",
  },
  {
    slug: "aretes-gota-violeta",
    nombre: "Aretes Gota Violeta",
    linea: "origen",
    par: "aretes-cascada-arcana",
    precio: 180000,
    precioFormato: "$180.000 COP",
    material: MATERIALES_LINEA.origen,
    categoria: "soberbia",
    badge: "Oro Laminado 18K & Amatista Natural",
    narrativa:
      "La elevación nace de la quietud. Cada gota de amatista captura esa luz introspectiva que dignifica el gesto, pendiendo con la suavidad que solo el nudo hecho a mano sabe dar.",
    especificaciones: INSPECCIONES_ORIGEN,
    tallas: [],
    imagen: imagenPrincipal(CARPETA_ARETES_GOTA_VIOLETA),
    imagenes: Object.values(imagenesPorColor(CARPETA_ARETES_GOTA_VIOLETA)),
    imagenesPorColor: imagenesPorColor(CARPETA_ARETES_GOTA_VIOLETA),
    colorHilo: "soberbia",
    modoAcceso: "disponible",
  },
  {
    slug: "pulsera-lazo-imperial",
    nombre: "Pulsera Lazo Imperial",
    linea: "origen",
    par: "brazalete-trama-de-poder",
    precio: 218000,
    precioFormato: "$218.000 COP",
    material: MATERIALES_LINEA.origen,
    categoria: "soberbia",
    badge: "Oro Laminado 18K & Amatista Natural",
    narrativa:
      "El lazo que se ciñe con intención sostiene la dignidad sin apretar. Un gesto noble, entrelazado para abrazar la altura serena que cada persona lleva dentro.",
    especificaciones: INSPECCIONES_ORIGEN,
    tallas: ["S (16 cm)", "M (18 cm)", "L (19 cm)"],
    imagen: imagenPrincipal(CARPETA_PULSERA_LAZO_IMPERIAL),
    imagenes: Object.values(imagenesPorColor(CARPETA_PULSERA_LAZO_IMPERIAL)),
    imagenesPorColor: imagenesPorColor(CARPETA_PULSERA_LAZO_IMPERIAL),
    colorHilo: "soberbia",
    modoAcceso: "disponible",
  },
  {
    slug: "choker-soberbia-sutil",
    nombre: "Choker Soberbia Sutil",
    linea: "origen",
    precio: 263000,
    precioFormato: "$263.000 COP",
    material: MATERIALES_LINEA.origen,
    categoria: "soberbia",
    badge: "Oro Laminado 18K & Amatista Natural",
    narrativa:
      "Un sello de nobleza que reposa junto a la piel. El choker de Soberbia marca un eje de calma y presencia, donde cada nudo confiere solemnidad a lo delicado.",
    especificaciones: INSPECCIONES_ORIGEN,
    tallas: ["S (33 cm)", "M (36 cm)", "L (39 cm)"],
    imagen: imagenPrincipal(CARPETA_GARGANTILLA_SOBERBIA_SUTIL),
    imagenes: Object.values(imagenesPorColor(CARPETA_GARGANTILLA_SOBERBIA_SUTIL)),
    imagenesPorColor: imagenesPorColor(CARPETA_GARGANTILLA_SOBERBIA_SUTIL),
    colorHilo: "soberbia",
    modoAcceso: "disponible",
  },
  {
    slug: "collar-doble-capas-de-soberbia",
    nombre: "Collar Doble Capas de Soberbia",
    linea: "origen",
    par: "collar-manto-de-soberbia",
    precio: 344000,
    precioFormato: "$344.000 COP",
    material: MATERIALES_LINEA.origen,
    categoria: "soberbia",
    badge: "Oro Laminado 18K & Amatista Natural",
    narrativa:
      "Capas que se elevan con armonía. Este collar celebra la dignidad que se construye con lentitud, tejida para sostener la majestuosidad discreta de quien lo lleva.",
    especificaciones: INSPECCIONES_ORIGEN,
    tallas: [],
    imagen: imagenPrincipal(CARPETA_COLLAR_DOBLE_CAPAS),
    imagenes: Object.values(imagenesPorColor(CARPETA_COLLAR_DOBLE_CAPAS)),
    imagenesPorColor: imagenesPorColor(CARPETA_COLLAR_DOBLE_CAPAS),
    colorHilo: "soberbia",
    modoAcceso: "disponible",
  },
];

export const productosSingular: Producto[] = [
  {
    slug: "anillo-nudo-imperial",
    nombre: "Anillo Nudo Imperial",
    linea: "singular",
    par: "anillo-nudo-sutil",
    precio: 1450000,
    precioFormato: "$1.450.000 COP",
    material: MATERIALES_LINEA.singular,
    categoria: "soberbia",
    badge: "Oro Macizo 18K & Gema de Selección Especial",
    narrativa: NARRATIVA_SINGULAR,
    especificaciones: INSPECCIONES_SINGULAR,
    tallas: [8, 9, 10, 11, 12],
    imagen: `${SINGULAR}/anillo_nudo _imperial.jpg`,
    imagenes: [`${SINGULAR}/anillo_nudo _imperial.jpg`],
    imagenSinOptimizar: true,
    colorHilo: "soberbia",
    modoAcceso: "circulo",
    insignia: "Edición Limitada / Obra Invariable",
  },
  {
    slug: "aretes-cascada-arcana",
    nombre: "Aretes Cascada Arcana",
    linea: "singular",
    par: "aretes-gota-violeta",
    precio: 1980000,
    precioFormato: "$1.980.000 COP",
    material: MATERIALES_LINEA.singular,
    categoria: "soberbia",
    badge: "Oro Macizo 18K & Gema de Selección Especial",
    narrativa: NARRATIVA_SINGULAR,
    especificaciones: INSPECCIONES_SINGULAR,
    tallas: [],
    imagen: `${SINGULAR}/aretes_cascada_arcana.jpg`,
    imagenes: [`${SINGULAR}/aretes_cascada_arcana.jpg`],
    colorHilo: "soberbia",
    modoAcceso: "circulo",
    insignia: "Edición Limitada / Obra Invariable",
  },
  {
    slug: "brazalete-trama-de-poder",
    nombre: "Brazalete Trama de Poder",
    linea: "singular",
    par: "pulsera-lazo-imperial",
    precio: 2650000,
    precioFormato: "$2.650.000 COP",
    material: MATERIALES_LINEA.singular,
    categoria: "soberbia",
    badge: "Oro Macizo 18K & Gema de Selección Especial",
    narrativa: NARRATIVA_SINGULAR,
    especificaciones: INSPECCIONES_SINGULAR,
    tallas: ["S (16 cm)", "M (18 cm)", "L (19 cm)"],
    imagen: `${SINGULAR}/brazalete_trama_de_poder.jpg`,
    imagenes: [`${SINGULAR}/brazalete_trama_de_poder.jpg`],
    colorHilo: "soberbia",
    modoAcceso: "espera",
    insignia: "Edición Limitada / Obra Invariable",
  },
  {
    slug: "collar-manto-de-soberbia",
    nombre: "Manto de Soberbia",
    linea: "singular",
    par: "collar-doble-capas-de-soberbia",
    precio: 3480000,
    precioFormato: "$3.480.000 COP",
    material: MATERIALES_LINEA.singular,
    categoria: "soberbia",
    badge: "Oro Macizo 18K & Gema de Selección Especial",
    narrativa: NARRATIVA_SINGULAR,
    especificaciones: INSPECCIONES_SINGULAR,
    tallas: [],
    imagen: `${SINGULAR}/collar_central_el_ manto_de_soberbia.jpg`,
    imagenes: [`${SINGULAR}/collar_central_el_ manto_de_soberbia.jpg`],
    imagenSinOptimizar: true,
    colorHilo: "soberbia",
    modoAcceso: "espera",
    insignia: "Edición Limitada / Obra Invariable",
  },
];

export const productosSoberbia: Producto[] = [
  ...productosOrigen,
  ...productosSingular,
];

export function productoPorSlug(slug: string): Producto | undefined {
  return productosSoberbia.find((p) => p.slug === slug);
}

export function contraparte(producto: Producto): Producto | undefined {
  return producto.par ? productoPorSlug(producto.par) : undefined;
}

/** Línea Origen activa por defecto; la Singular solo aparece si existe la pieza par. */
export function lineasDe(producto: Producto): Producto[] {
  const par = contraparte(producto);
  if (!par) return [producto];
  return producto.linea === "origen" ? [producto, par] : [par, producto];
}

export function lineaDe(producto: Producto): string {
  return LINEAS[producto.linea];
}
