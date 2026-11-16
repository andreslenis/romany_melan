import Image from "next/image";
import Link from "next/link";

import type { BlogPost } from "@/lib/blog";
import { formatearFecha } from "@/utils/format";

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const { frontmatter } = post;
  const href = `/blog/${post.slug}`;

  return (
    <article className="blog-card">
      {frontmatter.cover && (
        <Link
          href={href}
          className="blog-card-cover"
          aria-label={frontmatter.title}
          tabIndex={-1}
        >
          <Image
            src={frontmatter.cover}
            alt={frontmatter.coverAlt || frontmatter.title}
            fill
            sizes="(max-width: 768px) 90vw, 360px"
            style={{ objectFit: "cover" }}
          />
        </Link>
      )}
      <div className="blog-card-body">
        <div className="blog-card-meta">
          {frontmatter.categoria && (
            <span className="blog-card-categoria">{frontmatter.categoria}</span>
          )}
          <span>{formatearFecha(frontmatter.date)}</span>
        </div>
        <h2 className="blog-card-title">
          <Link href={href}>{frontmatter.title}</Link>
        </h2>
        <p className="blog-card-desc">{frontmatter.description}</p>
        <Link className="blog-card-link" href={href}>
          Leer artículo
        </Link>
      </div>
    </article>
  );
}