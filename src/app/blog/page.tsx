import type { Metadata } from "next";

import BlogCard from "@/components/blog/BlogCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getAllPosts } from "@/lib/blog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Artículos del taller de Romany Melan: significado de las piedras naturales, mineralogía, micro macramé y joyería de autor en Colombia.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog | Romany Melan",
    description:
      "Artículos del taller de Romany Melan: significado de las piedras naturales, mineralogía, micro macramé y joyería de autor en Colombia.",
    url: "/blog",
    type: "website",
  },
};

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  return (
    <>
      <SiteHeader />
      <main className="blog-index">
        <div className="container">
          <header className="blog-index-header">
            <h1 className="blog-index-title">Blog</h1>
            <p className="blog-index-intro">
              Historias del taller: el significado de las piedras naturales, la
              mineralogía ancestral y el arte del micro macramé aplicado a la
              joyería de autor.
            </p>
          </header>

          {posts.length === 0 ? (
            <p className="blog-empty">
              Próximamente publicaremos artículos del taller.
            </p>
          ) : (
            <div className="blog-grid">
              {posts.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}