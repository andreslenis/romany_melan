import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import BlogCta from "@/components/blog/BlogCta";
import BlogProse from "@/components/blog/BlogProse";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getBlogSlugs, getPostBySlug } from "@/lib/blog";
import { formatearFecha } from "@/utils/format";

export const revalidate = 3600;

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await getBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Artículo no encontrado",
      description:
        "Encuentra artículos sobre joyería de autor, piedras naturales y micro macramé en Romany Melan.",
    };
  }

  const { frontmatter } = post;
  const url = `/blog/${slug}`;

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      title: frontmatter.title,
      description: frontmatter.description,
      url,
      publishedTime: frontmatter.date,
      modifiedTime: frontmatter.updated,
      images: frontmatter.cover
        ? [{ url: frontmatter.cover, alt: frontmatter.coverAlt || frontmatter.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: frontmatter.title,
      description: frontmatter.description,
      images: frontmatter.cover ? [frontmatter.cover] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const { frontmatter } = post;

  return (
    <>
      <SiteHeader />
      <main className="blog-post">
        <div className="container">
          <article className="blog-post-article">
            <header className="blog-post-header">
              {frontmatter.categoria && (
                <span className="blog-post-categoria">{frontmatter.categoria}</span>
              )}
              <h1 className="blog-post-title">{frontmatter.title}</h1>
              <p className="blog-post-meta">
                <span>{formatearFecha(frontmatter.date)}</span>
                {frontmatter.updated && frontmatter.updated !== frontmatter.date && (
                  <span> · Actualizado el {formatearFecha(frontmatter.updated)}</span>
                )}
                {frontmatter.author && <span> · {frontmatter.author}</span>}
              </p>
            </header>

            {frontmatter.cover && (
              <div className="blog-post-cover">
                <Image
                  src={frontmatter.cover}
                  alt={frontmatter.coverAlt || frontmatter.title}
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 820px"
                  style={{ objectFit: "cover" }}
                />
              </div>
            )}

            <BlogProse
              content={post.content}
              fallbackAlt={frontmatter.coverAlt || frontmatter.title}
            />

            {frontmatter.cta?.map((cta, indice) => (
              <BlogCta key={`${cta.href}-${indice}`} cta={cta} />
            ))}
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}