import Link from "next/link";

import type { BlogCta as BlogCtaData } from "@/lib/blog";

interface BlogCtaProps {
  cta: BlogCtaData;
}

export default function BlogCta({ cta }: BlogCtaProps) {
  return (
    <div className="blog-cta">
      {cta.descripcion && <p className="blog-cta-text">{cta.descripcion}</p>}
      <Link className="cta-btn" href={cta.href}>
        {cta.etiqueta}
      </Link>
    </div>
  );
}