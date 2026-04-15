import { CATEGORIES } from "./categories";

export function labelFromSlug(slug: string): string {
  const found = CATEGORIES.find(c => c.slug === slug);
  if (found) return found.label;
  return titleCase(slug.replace(/-/g, " "));
}

export function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map(w => (w.length === 0 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}
