import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { Doc } from "../lib/types";
import { labelFromSlug } from "../lib/slug";

interface BreadcrumbProps {
  category: string;
  doc: Doc;
}

export default function Breadcrumb({ category, doc }: BreadcrumbProps) {
  return (
    <nav
      className="flex items-center gap-1.5 text-body2 text-vsc-textMuted"
      aria-label="Breadcrumb"
    >
      <Link
        to="/"
        className="hover:text-vsc-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vsc-accent rounded"
      >
        Home
      </Link>
      <ChevronRight className="w-3.5 h-3.5" />
      <span>{labelFromSlug(category)}</span>
      <ChevronRight className="w-3.5 h-3.5" />
      <span className="text-vsc-text">{doc.title}</span>
    </nav>
  );
}
