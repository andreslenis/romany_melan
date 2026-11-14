import { formatCOP } from "@/utils/format";

export interface PrecioProducto {
  precio: number;
  precioPromo?: number | null;
  promoActiva?: boolean | null;
}

/** Promocion vigente solo si el toggle esta activo y el valor es mayor a cero. */
export function promoVigente(p: PrecioProducto): boolean {
  return Boolean(p.promoActiva) && Number(p.precioPromo) > 0;
}

/** Precio que debe cobrarse / mostrarse como actual. */
export function precioFinal(p: PrecioProducto): number {
  return promoVigente(p) ? Number(p.precioPromo) : Number(p.precio) || 0;
}

/** Precio regular (tachado cuando hay promocion vigente). */
export function precioRegular(p: PrecioProducto): number {
  return Number(p.precio) || 0;
}

export function formatPrecio(value: number): string {
  return formatCOP(Number(value) || 0);
}