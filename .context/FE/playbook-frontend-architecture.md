# Data Engineering Playbook — Frontend Architecture & Implementation Plan

**Status:** Accepted
**Date:** 2026-04-15
**Owner:** Senior Frontend Architect
**Consumer:** frontend-dev subagent
**Project root:** `f:/data-engg/data-engg-playbook`

---

## 0. Up-Front Answer — Where `.md` Files Go

**Location:** `src/content/<category-slug>/<subcategory-slug>.md`

**Filename format:** kebab-case, lowercase, ASCII only, `.md` extension. Examples:
- `src/content/python/generators.md`
- `src/content/pyspark/window-functions.md`
- `src/content/azure-data-factory/linked-services.md`

**Category slugs (fixed, prescribed):**
`python`, `sql`, `pyspark`, `databricks`, `azure-data-factory`, `azure-functions`, `azure-synapse`, `dbt`, `airflow`, `terraform`, `docker`, `kubernetes`, `azure-devops`.

**Rule:** To add a new topic, drop a new `.md` file into the matching category folder. No code change required. The sidebar, routes, and search index all rebuild from the filesystem via `import.meta.glob`.

---

## 1. Interpretation of "Material UI Design"

The user said "Material UI design." This plan interprets that as the **Material Design visual language** (elevation, 8px spacing grid, type hierarchy, ripple-like feedback, clear surface layering) implemented entirely in **Tailwind CSS** — **not** the `@mui/material` React component library.

Rationale: MUI's runtime-CSS-in-JS bloats the bundle, fights Tailwind, and its built-in dark theme does not match VS Code Dark+. We get the Material *feel* (elevation, typography, spacing) while keeping Tailwind as the sole styling system and full control over the VS Code color palette.

**If this interpretation is wrong, stop here and correct before implementation.**

---

## 2. Tech Stack Decision Table

| Library | Purpose | Why Chosen | Rejected Alternative |
|---|---|---|---|
| **Vite 5** | Dev server + bundler | Fastest DX, native ESM, first-class `import.meta.glob` | Next.js — overkill for a local SPA, no SSR needed |
| **React 18** | UI framework | Ecosystem, team familiarity | Solid/Svelte — smaller community for MD tooling |
| **TypeScript 5** | Type safety | Catches content-schema drift early | Plain JS — no frontmatter validation |
| **React Router v6** | Client routing | Required by spec, stable data-router API | TanStack Router — less familiar, unnecessary |
| **Tailwind CSS 3** | Styling | Utility-first, zero runtime, co-locates with JSX | MUI / styled-components — runtime cost, conflicts with spec |
| **react-markdown** | Markdown to React | Plugin ecosystem, safe by default | MDX — we don't need JSX-in-MD for a reference site |
| **remark-gfm** | GFM tables, task lists, strikethrough | Required for code-recipe tables | — |
| **rehype-slug** | Heading IDs | Enables deep-linking to `#section` | — |
| **rehype-autolink-headings** | Anchor links on headings | Discoverable deep links | — |
| **react-syntax-highlighter** (Prism, `vscDarkPlus`) | Code highlighting | **Chosen.** Ships a `vscDarkPlus` theme that matches VS Code Dark+ exactly, synchronous, no WASM, tree-shakable via `PrismAsyncLight` | Shiki — rejected: async/WASM init, harder to tune, overkill for a local site |
| **gray-matter** | Frontmatter parsing | De-facto standard, works at build time | front-matter — less maintained |
| **MiniSearch** | Client-side full-text search | **Chosen.** ~8 KB gz, incremental indexing, field boosting, prefix + fuzzy, returns match positions for snippet highlighting | Fuse.js — slower on large corpora, weaker tokenization. FlexSearch — faster but larger API surface and awkward TS types |
| **cmdk** | Command palette primitive | Accessible, keyboard-first, pairs perfectly with Cmd/Ctrl+K UX | Headless UI Dialog — more wiring for the same result |
| **clsx** | Conditional class merging | Tiny, ergonomic | classnames — same thing, older |
| **lucide-react** | Icons | Clean line icons, tree-shakable, Material-adjacent aesthetic | Heroicons — fewer data-engineering-relevant glyphs |

**Fonts (self-hosted via `@fontsource`):**
- **Inter Variable** — UI text
- **JetBrains Mono** — code blocks and inline code

---

## 3. Folder Structure

```
f:/data-engg/data-engg-playbook/
├─ index.html
├─ package.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ vite.config.ts
├─ tailwind.config.ts
├─ postcss.config.js
├─ .context/
│  ├─ BA/
│  └─ FE/
│     └─ playbook-frontend-architecture.md      <-- this file
└─ src/
   ├─ main.tsx
   ├─ App.tsx
   ├─ index.css                                 (Tailwind directives + base layer)
   ├─ router.tsx                                (route table)
   │
   ├─ content/                                  (ALL .md files live here)
   │  ├─ python/
   │  │  ├─ generators.md
   │  │  ├─ decorators.md
   │  │  └─ context-managers.md
   │  ├─ sql/
   │  ├─ pyspark/
   │  ├─ databricks/
   │  ├─ azure-data-factory/
   │  ├─ azure-functions/
   │  ├─ azure-synapse/
   │  ├─ dbt/
   │  ├─ airflow/
   │  ├─ terraform/
   │  ├─ docker/
   │  ├─ kubernetes/
   │  └─ azure-devops/
   │
   ├─ lib/
   │  ├─ content.ts                             (glob loader, parses frontmatter, builds tree)
   │  ├─ categories.ts                          (fixed category metadata: slug, label, icon)
   │  ├─ search.ts                              (MiniSearch index builder + query fn)
   │  ├─ slug.ts                                (slug <-> label helpers)
   │  └─ types.ts                               (Doc, Category, Subcategory, SearchHit)
   │
   ├─ components/
   │  ├─ AppShell.tsx
   │  ├─ TopBar.tsx
   │  ├─ sidebar/
   │  │  ├─ Sidebar.tsx
   │  │  ├─ SidebarCategory.tsx
   │  │  └─ SidebarItem.tsx
   │  ├─ markdown/
   │  │  ├─ MarkdownView.tsx
   │  │  └─ CodeBlock.tsx
   │  ├─ search/
   │  │  └─ SearchPalette.tsx
   │  ├─ Breadcrumb.tsx
   │  ├─ EmptyState.tsx
   │  └─ NotFound.tsx
   │
   ├─ pages/
   │  ├─ HomePage.tsx                           (landing: welcome + recently updated)
   │  └─ DocPage.tsx                            (renders one .md by route params)
   │
   └─ styles/
      └─ tokens.css                             (CSS vars for VS Code palette)
```

---

## 4. Content Authoring Contract

### 4.1 Path

`src/content/<category-slug>/<subcategory-slug>.md`

### 4.2 Filename rules

- Lowercase kebab-case, ASCII only
- Matches `^[a-z0-9]+(-[a-z0-9]+)*\.md$`
- Subcategory slug is derived from the filename (minus `.md`)
- Category slug is the parent directory name and MUST be one of the 13 fixed slugs

### 4.3 Frontmatter schema (parsed by gray-matter)

```yaml
---
title: "Generators and Lazy Iteration"        # required, string
category: "python"                              # required, must match parent folder slug
subcategory: "generators"                       # required, must match filename (no .md)
tags: ["iterators", "memory", "performance"]    # required, string[] (may be empty)
updated: "2026-04-12"                           # required, ISO date (YYYY-MM-DD)
---
```

**Validation:** `src/lib/content.ts` throws at build/load time if any required field is missing, if `category` mismatches the folder, or if `subcategory` mismatches the filename. Fail loud — this is a personal site; broken content should block the dev server.

### 4.4 Body rules

- First `#` heading is optional (title comes from frontmatter); prefer starting at `##`.
- Code fences must declare a language: ` ```python `, ` ```sql `, ` ```bash `, ` ```hcl `, ` ```yaml `, ` ```json `.
- Inline code uses single backticks.
- GFM tables allowed.

---

## 5. Example `.md` File

`src/content/python/generators.md`:

````markdown
---
title: "Generators and Lazy Iteration"
category: "python"
subcategory: "generators"
tags: ["iterators", "memory", "performance", "pipelines"]
updated: "2026-04-12"
---

## Why Generators

Generators yield values one at a time and hold almost no memory. Use them
whenever a data pipeline would otherwise materialize a large intermediate list.

## Minimal Example

```python
from typing import Iterator

def read_large_csv(path: str) -> Iterator[dict]:
    import csv
    with open(path, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            yield row

# Constant memory regardless of file size
for row in read_large_csv("events.csv"):
    if row["status"] == "ERROR":
        print(row["id"])
```

## Gotchas

| Gotcha | Fix |
|---|---|
| Generator exhausts after one pass | Wrap creation in a factory function |
| `len()` does not work | Track count manually or convert to list (defeats the point) |
````

---

## 6. Example Subcategory Folder Layout

`src/content/pyspark/`:

```
src/content/pyspark/
├─ dataframe-basics.md
├─ window-functions.md
├─ broadcast-joins.md
├─ partitioning-strategies.md
├─ udfs-and-pandas-udfs.md
├─ delta-merge-patterns.md
└─ performance-tuning.md
```

Each file is a self-contained recipe. No `index.md`, no nested folders — deliberately flat to keep routing and sidebar code trivial.

---

## 7. Sidebar Data Model + Glob Pattern

### 7.1 Types (`src/lib/types.ts`)

```ts
export interface Frontmatter {
  title: string;
  category: CategorySlug;
  subcategory: string;
  tags: string[];
  updated: string; // ISO date
}

export interface Doc extends Frontmatter {
  body: string;          // raw markdown body (no frontmatter)
  path: string;          // e.g. "/python/generators"
  headings: { id: string; text: string; level: number }[];
}

export interface Subcategory {
  slug: string;
  title: string;
  path: string;
  updated: string;
}

export interface Category {
  slug: CategorySlug;
  label: string;
  icon: string;        // lucide icon name
  subcategories: Subcategory[];
}

export type CategorySlug =
  | "python" | "sql" | "pyspark" | "databricks"
  | "azure-data-factory" | "azure-functions" | "azure-synapse"
  | "dbt" | "airflow" | "terraform" | "docker" | "kubernetes" | "azure-devops";
```

### 7.2 Fixed category registry (`src/lib/categories.ts`)

```ts
export const CATEGORIES: { slug: CategorySlug; label: string; icon: string }[] = [
  { slug: "python",              label: "Python",               icon: "FileCode2" },
  { slug: "sql",                 label: "SQL",                  icon: "Database" },
  { slug: "pyspark",             label: "PySpark",              icon: "Flame" },
  { slug: "databricks",          label: "Databricks",           icon: "Brick" },
  { slug: "azure-data-factory",  label: "Azure Data Factory",   icon: "Factory" },
  { slug: "azure-functions",     label: "Azure Functions",      icon: "Zap" },
  { slug: "azure-synapse",       label: "Azure Synapse",        icon: "Network" },
  { slug: "dbt",                 label: "DBT",                  icon: "Layers" },
  { slug: "airflow",             label: "Airflow",              icon: "Wind" },
  { slug: "terraform",           label: "Terraform",            icon: "Boxes" },
  { slug: "docker",              label: "Docker",               icon: "Container" },
  { slug: "kubernetes",          label: "Kubernetes",           icon: "Ship" },
  { slug: "azure-devops",        label: "Azure DevOps",         icon: "GitBranch" },
];
```

### 7.3 Glob loader (`src/lib/content.ts`)

```ts
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
```

**Why `src/content/` and not `public/`:** `public/` files are served as-is and would require runtime `fetch()` calls per doc — slow, no type safety, no build-time validation, no search indexing without a second round trip. `src/content/` with eager `import.meta.glob` gives us a single synchronous in-memory corpus at app start, full TS validation, zero network calls, and lets Vite rebuild instantly on file edits in dev.

---

## 8. Component Breakdown

| Component | Responsibility | Key Props |
|---|---|---|
| `AppShell` | Top-level layout: `<TopBar />` + `<Sidebar />` + `<main><Outlet/></main>`. Hosts `<SearchPalette />`. Registers global Cmd/Ctrl+K listener. | none |
| `TopBar` | Branding ("Data Engineering Playbook"), version/updated timestamp, search-trigger button (shows `⌘K` / `Ctrl K` hint), theme indicator. | `onOpenSearch: () => void` |
| `Sidebar` | Scrollable left nav. Maps over `SIDEBAR` and renders `SidebarCategory` for each. Sticky, full-height. | `categories: Category[]` |
| `SidebarCategory` | One expandable category. Shows icon + label + chevron. Expanded state derived from active route (auto-expands category containing current doc). | `category: Category`, `activePath: string` |
| `SidebarItem` | One subcategory link. Highlights when active. | `path: string`, `title: string`, `active: boolean` |
| `SearchPalette` | Cmd/Ctrl+K modal using `cmdk`. Debounced MiniSearch query. Arrow-key nav, Enter to navigate, Esc to close. | `open: boolean`, `onClose: () => void` |
| `MarkdownView` | Renders `react-markdown` with `remark-gfm`, `rehype-slug`, `rehype-autolink-headings`, and custom `code` renderer → `CodeBlock`. | `source: string` |
| `CodeBlock` | Syntax-highlighted block using `react-syntax-highlighter` with `vscDarkPlus`. Copy-to-clipboard button top-right with transient "Copied" state. Language label bottom-left. | `language: string`, `value: string` |
| `Breadcrumb` | `Home › Python › Generators`. Derived from route params + doc title. | `category: string`, `doc: Doc` |
| `EmptyState` | Shown on `HomePage` when a category has no docs yet, and as placeholder on home. | `title: string`, `description: string`, `icon?: string` |
| `NotFound` | 404 for unknown routes. | none |
| `DocPage` | Route component. Resolves `:category/:subcategory` via `DOCS_BY_PATH`. Renders `Breadcrumb` + `MarkdownView`, or `NotFound`. | uses `useParams` |
| `HomePage` | Landing: title, short intro, "Recently updated" list (top 8 by `updated` desc), keyboard hint for search. | none |

---

## 9. Routing Map

Using React Router v6 data router (`createBrowserRouter`).

| Path | Component | Notes |
|---|---|---|
| `/` | `HomePage` | Landing |
| `/:category/:subcategory` | `DocPage` | Looks up `/${category}/${subcategory}` in `DOCS_BY_PATH` |
| `*` | `NotFound` | Fallback |

All routes are children of `AppShell` so sidebar and top bar persist.

`Sidebar` uses `useLocation()` to compute `activePath` and auto-expand the matching category.

---

## 10. Search Architecture

### 10.1 Index (`src/lib/search.ts`)

```ts
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
```

**Indexed fields:** `title` (boost 5), `headings` (boost 3), `tags` (boost 2), `body` (boost 1). Code fences stripped from body to avoid noisy matches on keywords like `def` or `select`.

### 10.2 UI

- `SearchPalette` built on `cmdk`.
- Global keydown listener in `AppShell`: `(e.metaKey || e.ctrlKey) && e.key === "k"` → `e.preventDefault(); setOpen(true)`.
- Input debounced 120 ms.
- Each result row: `<icon> Category › Subcategory — <bold title>` plus a secondary line of snippet. Snippet = first 140 chars of body containing the query term, with matched tokens wrapped in `<mark>`.
- Arrow keys move selection; Enter calls `navigate(hit.id)`; Esc closes.

---

## 11. Tailwind Configuration

### 11.1 `tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // VS Code Dark+ palette
        vsc: {
          bg:          "#1e1e1e", // editor background
          sidebar:     "#252526", // sidebar background
          panel:       "#1f1f1f", // elevated surface
          border:      "#333333",
          borderSoft:  "#2a2a2a",
          hover:       "#2a2d2e", // list hover
          active:      "#094771", // list active (VS Code selection blue)
          accent:      "#007acc", // primary accent
          accentHover: "#1b8ad6",
          text:        "#d4d4d4", // default text
          textMuted:   "#9ca3af",
          textDim:     "#6b7280",
          heading:     "#ffffff",
          link:        "#4ec9b0",
          codeBg:      "#1e1e1e",
          inlineCode:  "#ce9178",
          success:     "#4ec9b0",
          warning:     "#dcdcaa",
          error:       "#f48771",
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        // Material-ish type scale
        "body":  ["14px", { lineHeight: "1.65" }],
        "body2": ["13px", { lineHeight: "1.6" }],
        "h1":    ["28px", { lineHeight: "1.25", fontWeight: "600" }],
        "h2":    ["22px", { lineHeight: "1.3",  fontWeight: "600" }],
        "h3":    ["18px", { lineHeight: "1.35", fontWeight: "600" }],
      },
      spacing: {
        // 8px grid helpers
        "sidebar": "280px",
        "topbar":  "48px",
      },
      boxShadow: {
        // Material elevation
        "elev-1": "0 1px 2px rgba(0,0,0,0.4), 0 1px 1px rgba(0,0,0,0.3)",
        "elev-2": "0 2px 4px rgba(0,0,0,0.5), 0 2px 3px rgba(0,0,0,0.35)",
        "elev-4": "0 6px 14px rgba(0,0,0,0.55), 0 3px 6px rgba(0,0,0,0.4)",
      },
      borderRadius: {
        "md2": "6px",
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### 11.2 `src/index.css`

```css
@import "@fontsource-variable/inter";
@import "@fontsource/jetbrains-mono/400.css";
@import "@fontsource/jetbrains-mono/600.css";

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body, #root { height: 100%; }
  body {
    @apply bg-vsc-bg text-vsc-text font-sans text-body antialiased;
  }
  *::selection { background: #264f78; color: #fff; }
  /* Scrollbars — VS Code style */
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-thumb { background: #424242; border-radius: 5px; }
  ::-webkit-scrollbar-thumb:hover { background: #4f4f4f; }
}
```

Root element gets `class="dark"` at mount (single theme only).

---

## 12. Build Order for frontend-dev

Each step lists files to create/edit and an acceptance check. Do them in order.

### Step 1 — Scaffold

**Create/edit:**
- `package.json` (via `npm create vite@latest . -- --template react-ts`)
- Install deps:
  ```
  npm i react-router-dom react-markdown remark-gfm rehype-slug rehype-autolink-headings \
        react-syntax-highlighter gray-matter minisearch cmdk clsx lucide-react \
        @fontsource-variable/inter @fontsource/jetbrains-mono
  npm i -D tailwindcss postcss autoprefixer @types/react-syntax-highlighter
  npx tailwindcss init -p
  ```
- `tsconfig.json`: enable `"strict": true`, `"moduleResolution": "bundler"`.
- `vite.config.ts`: default React plugin; set `server.port = 5173`.

**Acceptance:** `npm run dev` serves blank Vite + React app at `http://localhost:5173`.

### Step 2 — Tailwind + Theme

**Create/edit:**
- `tailwind.config.ts` — paste section 11.1 verbatim.
- `src/index.css` — paste section 11.2 verbatim.
- `src/main.tsx` — add `document.documentElement.classList.add("dark")` before `createRoot`.
- Replace `App.tsx` with a temporary `<div className="p-8 text-h1 text-vsc-heading">Playbook</div>`.

**Acceptance:** Page renders with `#1e1e1e` background, white heading, Inter font.

### Step 3 — Content Pipeline

**Create/edit:**
- `src/lib/types.ts` — paste section 7.1.
- `src/lib/categories.ts` — paste section 7.2.
- `src/lib/content.ts` — paste section 7.3.
- `src/lib/slug.ts` — small helpers: `labelFromSlug`, `titleCase`.
- Seed content: create `src/content/python/generators.md` from section 5, plus two more stub files in any two other categories so multiple categories are non-empty during dev.

**Acceptance:** `console.log(DOCS)` in `App.tsx` logs parsed docs. Throwing an intentional category/folder mismatch breaks the dev server with the expected error message. Remove the log.

### Step 4 — Sidebar + AppShell + TopBar

**Create/edit:**
- `src/components/AppShell.tsx` — CSS grid: `grid-cols-[280px_1fr] grid-rows-[48px_1fr]`. TopBar spans both cols; Sidebar in col 1 row 2; `<Outlet/>` wrapper in col 2 row 2 with `overflow-y-auto`.
- `src/components/TopBar.tsx` — left: lucide `Database` icon + "Data Engineering Playbook" in `text-vsc-heading font-semibold`. Right: search-trigger button styled as pill with `⌘K` / `Ctrl K` kbd. Background `bg-vsc-sidebar border-b border-vsc-border shadow-elev-1`.
- `src/components/sidebar/Sidebar.tsx` — `bg-vsc-sidebar border-r border-vsc-border`, sticky, scrollable. Maps `SIDEBAR`.
- `src/components/sidebar/SidebarCategory.tsx` — button row (icon + label + chevron). Click toggles expanded. Auto-expand if any child path matches current route. Children rendered in a list below with left padding.
- `src/components/sidebar/SidebarItem.tsx` — `<NavLink>` with active class `bg-vsc-active text-white` else `hover:bg-vsc-hover text-vsc-text`. Left border 2px on active in `border-vsc-accent`.
- Temporary routing: wrap `AppShell` with `BrowserRouter` and render a placeholder main content.

**Acceptance:** Sidebar shows all 13 categories, each expandable. Categories with seed docs show sub-items. Hover and active states visually match VS Code Explorer.

### Step 5 — Markdown Renderer + CodeBlock

**Create/edit:**
- `src/components/markdown/CodeBlock.tsx`:
  ```tsx
  import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
  import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
  import { Copy, Check } from "lucide-react";
  import { useState } from "react";
  ```
  Wrapper `relative group rounded-md2 overflow-hidden border border-vsc-borderSoft bg-vsc-codeBg shadow-elev-1`. Copy button absolute top-2 right-2, `opacity-0 group-hover:opacity-100 transition`, toggles `Copy` → `Check` for 1500ms via `setTimeout`. Language badge absolute bottom-2 left-2 `text-xs text-vsc-textMuted`.
- `src/components/markdown/MarkdownView.tsx`:
  ```tsx
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]]}
    components={{
      code({ inline, className, children }) {
        const lang = /language-(\w+)/.exec(className || "")?.[1] ?? "text";
        if (inline) return <code className="px-1 py-0.5 rounded bg-vsc-panel text-vsc-inlineCode font-mono text-[0.9em]">{children}</code>;
        return <CodeBlock language={lang} value={String(children).replace(/\n$/, "")} />;
      },
      h1: p => <h1 className="text-h1 text-vsc-heading mt-8 mb-4" {...p} />,
      h2: p => <h2 className="text-h2 text-vsc-heading mt-8 mb-3 pb-2 border-b border-vsc-borderSoft" {...p} />,
      h3: p => <h3 className="text-h3 text-vsc-heading mt-6 mb-2" {...p} />,
      p:  p => <p className="my-4 text-vsc-text" {...p} />,
      a:  p => <a className="text-vsc-accent hover:text-vsc-accentHover underline underline-offset-2" {...p} />,
      ul: p => <ul className="list-disc pl-6 my-4 space-y-1" {...p} />,
      ol: p => <ol className="list-decimal pl-6 my-4 space-y-1" {...p} />,
      table: p => <table className="my-6 w-full text-body2 border border-vsc-border" {...p} />,
      th: p => <th className="text-left px-3 py-2 bg-vsc-panel border-b border-vsc-border" {...p} />,
      td: p => <td className="px-3 py-2 border-b border-vsc-borderSoft" {...p} />,
      blockquote: p => <blockquote className="border-l-4 border-vsc-accent pl-4 my-4 text-vsc-textMuted italic" {...p} />,
    }}
  >{source}</ReactMarkdown>
  ```

**Acceptance:** Navigating to `/python/generators` (hardcoded route for now) renders the markdown with syntax-highlighted Python, copy button on hover, language badge, proper typography.

### Step 6 — Routing

**Create/edit:**
- `src/router.tsx` with `createBrowserRouter`:
  ```ts
  createBrowserRouter([
    { element: <AppShell />, children: [
      { path: "/", element: <HomePage /> },
      { path: ":category/:subcategory", element: <DocPage /> },
      { path: "*", element: <NotFound /> },
    ]},
  ]);
  ```
- `src/main.tsx` — mount `<RouterProvider router={router} />`.
- `src/pages/HomePage.tsx` — welcome card + "Recently Updated" list (top 8 docs by `updated` desc, each as `<NavLink>` pill).
- `src/pages/DocPage.tsx`:
  ```tsx
  const { category, subcategory } = useParams();
  const doc = DOCS_BY_PATH.get(`/${category}/${subcategory}`);
  if (!doc) return <NotFound />;
  return (<article className="max-w-3xl mx-auto px-8 py-8">
    <Breadcrumb category={doc.category} doc={doc} />
    <h1 className="text-h1 text-vsc-heading mt-2 mb-6">{doc.title}</h1>
    <MarkdownView source={doc.body} />
  </article>);
  ```
- `src/components/Breadcrumb.tsx` — `Home › <Category Label> › <Doc Title>` with chevron separators, muted color, home link.
- `src/components/NotFound.tsx` + `src/components/EmptyState.tsx`.

**Acceptance:** Clicking any sidebar item routes to the doc. Breadcrumb accurate. Unknown routes show NotFound. Home page shows recently updated list.

### Step 7 — Search Palette

**Create/edit:**
- `src/lib/search.ts` — paste section 10.1.
- `src/components/search/SearchPalette.tsx`:
  - Built on `cmdk`'s `Command.Dialog`.
  - Overlay `bg-black/60 backdrop-blur-sm`, panel `bg-vsc-sidebar border border-vsc-border shadow-elev-4 rounded-md2 w-[640px] max-w-[90vw]`.
  - Input: full width, `bg-transparent text-vsc-text px-4 py-3 border-b border-vsc-border` with placeholder "Search the playbook…".
  - Results list: scrollable `max-h-[60vh]`. Each item: category label + chevron + subcategory + title (bold, matches highlighted), snippet on line 2 in `text-vsc-textMuted text-body2`.
  - Debounce 120ms via `useDeferredValue`.
  - On select: `navigate(hit.id); onClose()`.
- `AppShell` global listener:
  ```ts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  ```
- Wire TopBar search button to `setOpen(true)`.

**Acceptance:** Cmd/Ctrl+K opens palette anywhere. Typing "generator" surfaces the generators doc. Enter navigates to it. Esc closes. Click-outside closes.

### Step 8 — Polish

**Create/edit:**
- Focus-visible rings `focus-visible:ring-2 ring-vsc-accent ring-offset-0` on all interactive elements.
- Smooth `scroll-mt-16` on headings so anchor jumps clear the top bar.
- Add 8–10 more real content files across at least 5 categories to validate.
- Bundle check: `npm run build && du -sh dist` — target < 600 KB gzipped.
- Add `react-syntax-highlighter` tree-shake: import languages individually if bundle exceeds target:
  ```ts
  import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
  import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
  SyntaxHighlighter.registerLanguage("python", python);
  // register: sql, bash, yaml, json, hcl, dockerfile, typescript
  ```

**Acceptance:**
- Lighthouse (desktop) performance >= 95.
- First load < 600 KB gzipped.
- All 13 sidebar categories visible, empty ones render a muted "No entries yet" child.
- Search indexes every file at startup in < 200 ms.
- Every code block copy button works and shows "Copied" feedback.

---

## 13. Success Criteria

| Criterion | Target |
|---|---|
| Add a new doc = drop one `.md` file | Zero code changes |
| Sidebar reflects filesystem | Auto via `import.meta.glob` |
| Search across all docs | < 50 ms query latency |
| Dark theme matches VS Code Dark+ | Exact hex values from section 11.1 |
| Code blocks copyable | 100% of fenced blocks |
| Keyboard-first search | Cmd/Ctrl+K, arrows, Enter, Esc |
| Build output | < 600 KB gzipped |
| Type safety | `tsc --noEmit` clean, strict mode |

---

## 14. Open Questions (flagged, not blocking)

1. **Per-doc table of contents** on the right side — deferred. Add only if docs grow long enough to warrant it.
2. **Search persistence of recent queries** — deferred. Add with `localStorage` if desired later.
3. **Export / print styles** — not in scope.
4. **Content linting (schema validation CLI)** — current build-time throw is sufficient for a personal site; revisit if a CI pipeline is added.

---

## 15. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| `react-syntax-highlighter` bloats bundle | Use `PrismAsyncLight` + explicit language registration (Step 8) |
| Large corpus slows startup | MiniSearch is incremental; if > 1000 docs, move index build to a Web Worker |
| Frontmatter typos cause silent breakage | Loader throws loudly on category/subcategory mismatch (Step 3) |
| Code-fence language detection fails | Default to `text` in `MarkdownView` code renderer |
| Cmd/Ctrl+K collision with browser | `preventDefault()` in listener (Step 7) |
