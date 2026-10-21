export type Linea = "origen" | "singular";

export const LINEAS: Record<Linea, string> = {
  origen: "Línea Origen - Oro Laminado 18K & Gema Natural",
  singular: "Línea Singular - Oro Macizo 18K & Gema de Selección Especial",
};

export const LINEAS_CORTAS: Record<Linea, string> = {
  origen: "Línea Origen",
  singular: "Línea Singular",
};

export const MATERIALES_LINEA: Record<Linea, string> = {
  origen: "Oro Laminado 18K & Gema Natural",
  singular: "Oro Macizo 18K & Gema de Selección Especial",
};

export interface ColorHilo {
  id: string;
  nombre: string;
  hex: string;
  pecado: string;
}

export type ModoAcceso = "disponible" | "circulo" | "espera";

export interface Producto {
  slug: string;
  nombre: string;
  linea: Linea;
  par?: string;
  precio: number;
  precioFormato: string;
  material: string;
  categoria: string;
  badge: string;
  narrativa: string;
  especificaciones: {
    material: string;
    componentes: string;
    piedra: string;
  };
  tallas: (string | number)[];
  imagen: string;
  imagenes: string[];
  imagenesPorColor?: Record<string, string>;
  imagenSinOptimizar?: boolean;
  colorHilo: string | null;
  modoAcceso: ModoAcceso;
  insignia?: string;
}

export interface CartItem {
  slug: string;
  nombre: string;
  linea: string;
  lineaId: Linea;
  precio: number;
  imagen: string;
  cantidad: number;
  talla: string | null;
  colorHilo: string | null;
  colorHiloHex: string | null;
  observaciones: string;
}

export interface DireccionEnvio {
  nombre: string;
  email: string;
  telefono: string;
  departamento: string;
  ciudad: string;
  direccion: string;
  barrio: string;
  codigoPostal: string;
  notas: string;
}

export type EstadoEnvio =
  | "confirmado"
  | "preparacion"
  | "despachado"
  | "en-transito"
  | "entregado";

export const ESTADOS_ENVIO: { id: EstadoEnvio; label: string; descripcion: string }[] = [
  {
    id: "confirmado",
    label: "Pago confirmado",
    descripcion: "Recibimos tu pago y reservamos tus piezas.",
  },
  {
    id: "preparacion",
    label: "En preparación",
    descripcion: "Tus piezas se empacan con empaque de lujo y certificado.",
  },
  {
    id: "despachado",
    label: "Despachado",
    descripcion: "La guía fue entregada a la transportadora.",
  },
  {
    id: "en-transito",
    label: "En tránsito",
    descripcion: "Tu historia viaja hacia la dirección registrada.",
  },
  {
    id: "entregado",
    label: "Entregado",
    descripcion: "La pieza llegó. Tu certificado ya está en Mis Historias.",
  },
];

export interface Pedido {
  id: string;
  referencia: string;
  fecha: string;
  items: CartItem[];
  total: number;
  totalFormato: string;
  direccion: DireccionEnvio;
  metodoPago: string;
  estado: EstadoEnvio;
  certificado: string;
  esMiembro: boolean;
}

export interface Perfil {
  nombre: string;
  email: string;
  telefono: string;
  miembro: boolean;
  desde: string;
  proveedor: "manual" | "google" | "apple";
}

export interface SolicitudEspera {
  id: string;
  slug: string;
  nombre: string;
  email: string;
  fecha: string;
  linea: Linea;
}
