export function formatCOP(value: number): string {
  const num = Number(value);
  if (isNaN(num)) return "$ 0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Interpreta una fecha ISO (YYYY-MM-DD) en hora local para evitar que
 * la zona horaria retroceda el día al formatear.
 */
export function parseFechaLocal(iso: string): Date {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (coincidencia) {
    const [, anio, mes, dia] = coincidencia;
    return new Date(Number(anio), Number(mes) - 1, Number(dia));
  }
  return new Date(iso);
}

export function formatearFecha(iso: string): string {
  const fecha = parseFechaLocal(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(fecha);
}
