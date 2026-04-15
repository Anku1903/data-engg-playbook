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
