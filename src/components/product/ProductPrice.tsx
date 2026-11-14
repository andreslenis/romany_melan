import { formatCOP } from "@/utils/format";

interface Props {
  precio: number;
  precioPromo?: number | null;
  promoActiva?: boolean | null;
  className?: string;
}

/** Muestra el precio de promoción y el regular tachado, o solo el precio regular. */
export default function ProductPrice({ precio, precioPromo, promoActiva, className }: Props) {
  const promo = Boolean(promoActiva) && Number(precioPromo) > 0;

  if (promo) {
    return (
      <span className={className}>
        <span className="product-price-promo">{formatCOP(Number(precioPromo))}</span>
        <span className="product-price-old">{formatCOP(Number(precio))}</span>
      </span>
    );
  }

  return <span className={className}>{formatCOP(Number(precio))}</span>;
}