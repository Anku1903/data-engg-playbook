import MiniSearch from "minisearch";
import { DOCS } from "./content";

export interface SearchDoc {
  id: string;          // doc.path
  title: string;
  category: string;    // human label
  subcategory: string;
  tags: string;        // joined for full-text
  headings: string;    // joined heading text
  body: string;        // raw markdown minus code fences (see below)
}

function stripCode(md: string): string {
  return md.replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");
}

export const searchIndex = new MiniSearch<SearchDoc>({
  fields: ["title", "headings", "tags", "body", "category", "subcategory"],
  storeFields: ["title", "category", "subcategory", "id"],
  searchOptions: {
    boost: { title: 5, headings: 3, tags: 2, body: 1 },
    prefix: true,
    fuzzy: 0.2,
  },
});

searchIndex.addAll(
  DOCS.map(d => ({
    id: d.path,
    title: d.title,
    category: d.category,
    subcategory: d.subcategory,
    tags: d.tags.join(" "),
    headings: d.headings.map(h => h.text).join(" "),
    body: stripCode(d.body),
  })),
);

export function runSearch(q: string) {
  if (!q.trim()) return [];
  return searchIndex.search(q).slice(0, 20);
}

export function makeSnippet(body: string, query: string): string {
  const stripped = stripCode(body).replace(/\s+/g, " ").trim();
  if (!query.trim()) return stripped.slice(0, 140);
  const firstToken = query.trim().split(/\s+/)[0].toLowerCase();
  const idx = stripped.toLowerCase().indexOf(firstToken);
  if (idx === -1) return stripped.slice(0, 140);
  const start = Math.max(0, idx - 40);
  const end = Math.min(stripped.length, idx + 100);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < stripped.length ? "…" : "";
  return prefix + stripped.slice(start, end) + suffix;
}
