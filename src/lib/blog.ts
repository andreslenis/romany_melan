import fs from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

export interface BlogCta {
  etiqueta: string;
  href: string;
  descripcion?: string;
}

export interface BlogFrontmatter {
  title: string;
  description: string;
  date: string;
  updated?: string;
  author?: string;
  categoria?: string;
  cover?: string;
  coverAlt?: string;
  tags?: string[];
  cta?: BlogCta[];
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
  content: string;
}

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function toStringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function toCtaList(value: unknown): BlogCta[] {
  if (!Array.isArray(value)) return [];

  const ctas: BlogCta[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const registro = item as Record<string, unknown>;
    const etiqueta = toStringValue(registro.etiqueta);
    const href = toStringValue(registro.href);
    if (!etiqueta || !href) continue;
    ctas.push({
      etiqueta,
      href,
      descripcion: toStringValue(registro.descripcion),
    });
  }
  return ctas;
}

function toTagList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((tag) => toStringValue(tag))
    .filter((tag): tag is string => Boolean(tag));
}

function parsePost(slug: string, raw: string): BlogPost | null {
  const { data, content } = matter(raw);
  const title = toStringValue(data.title);
  const description = toStringValue(data.description);

  if (!title || !description) {
    console.error(`[blog] ${slug}: faltan title o description en el frontmatter`);
    return null;
  }

  const frontmatter: BlogFrontmatter = {
    title,
    description,
    date: toStringValue(data.date) || new Date().toISOString().slice(0, 10),
    updated: toStringValue(data.updated),
    author: toStringValue(data.author),
    categoria: toStringValue(data.categoria),
    cover: toStringValue(data.cover),
    coverAlt: toStringValue(data.coverAlt),
    tags: toTagList(data.tags),
    cta: toCtaList(data.cta),
  };

  return { slug, frontmatter, content: content.trim() };
}

export async function getBlogSlugs(): Promise<string[]> {
  try {
    const files = await fs.readdir(BLOG_DIR);
    return files
      .filter((file) => file.toLowerCase().endsWith(".md"))
      .map((file) => file.replace(/\.md$/i, ""));
  } catch (error) {
    console.error("[blog] getBlogSlugs", error);
    return [];
  }
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const slugs = await getBlogSlugs();
  const posts: BlogPost[] = [];

  for (const slug of slugs) {
    const post = await getPostBySlug(slug);
    if (post) posts.push(post);
  }

  return posts.sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const raw = await fs.readFile(path.join(BLOG_DIR, `${slug}.md`), "utf-8");
    return parsePost(slug, raw);
  } catch (error) {
    console.error(`[blog] getPostBySlug ${slug}`, error);
    return null;
  }
}