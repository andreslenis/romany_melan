export function formatCOP(value: number): string {
  const num = Number(value);
  if (isNaN(num)) return "$ 0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(num);
}
