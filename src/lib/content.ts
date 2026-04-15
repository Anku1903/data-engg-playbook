import matter from "gray-matter";
import { CATEGORIES } from "./categories";
import type { Category, Doc, CategorySlug, Frontmatter } from "./types";

// Eager import because corpus is small (< few hundred files) and we need the
// search index at startup. Vite inlines the raw text at build time.
const files = import.meta.glob("/src/content/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

function parseDoc(filePath: string, raw: string): Doc {
  // filePath: "/src/content/python/generators.md"
  const parts = filePath.split("/");
  const folder = parts[parts.length - 2] as CategorySlug;
  const fileSlug = parts[parts.length - 1].replace(/\.md$/, "");

  const { data, content } = matter(raw);
  const fm = data as Frontmatter;

  if (fm.category !== folder) {
    throw new Error(`[content] ${filePath}: frontmatter.category "${fm.category}" != folder "${folder}"`);
  }
  if (fm.subcategory !== fileSlug) {
    throw new Error(`[content] ${filePath}: frontmatter.subcategory "${fm.subcategory}" != filename "${fileSlug}"`);
  }

  return {
    ...fm,
    body: content,
    path: `/${folder}/${fileSlug}`,
    headings: extractHeadings(content),
  };
}

export const DOCS: Doc[] = Object.entries(files)
  .map(([p, raw]) => parseDoc(p, raw))
  .sort((a, b) => a.title.localeCompare(b.title));

export const DOCS_BY_PATH: Map<string, Doc> = new Map(DOCS.map(d => [d.path, d]));

export const SIDEBAR: Category[] = CATEGORIES.map(cat => ({
  slug: cat.slug,
  label: cat.label,
  icon: cat.icon,
  subcategories: DOCS
    .filter(d => d.category === cat.slug)
    .map(d => ({ slug: d.subcategory, title: d.title, path: d.path, updated: d.updated })),
}));

function extractHeadings(md: string) {
  const out: { id: string; text: string; level: number }[] = [];
  const re = /^(#{1,6})\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    const level = m[1].length;
    const text = m[2].trim();
    const id = text.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
    out.push({ id, text, level });
  }
  return out;
}
