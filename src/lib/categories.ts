import type { CategorySlug } from "./types";

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
