import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { Clock, Command as CommandIcon, ArrowRight, Sparkles } from "lucide-react";
import { DOCS } from "../lib/content";
import { labelFromSlug } from "../lib/slug";

export default function HomePage() {
  const recent = useMemo(
    () => [...DOCS].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 8),
    [],
  );

  const isMac = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      /Mac|iPod|iPhone|iPad/.test(navigator.platform),
    [],
  );

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-10 py-8 sm:py-12">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-lg2 border border-vsc-borderHair hero-surface p-6 sm:p-10">
        <div className="absolute inset-0 grid-overlay opacity-60 pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 h-7 rounded-full2 bg-vsc-accentSoft text-vsc-accent text-[11px] font-medium tracking-wide">
            <Sparkles className="w-3 h-3" />
            <span>Personal Knowledge Base</span>
          </div>
          <h1 className="mt-5 text-[32px] leading-[1.1] sm:text-hero font-display text-vsc-heading tracking-tightest">
            Your data engineering <br />
            <span className="text-vsc-accent">reference library.</span>
          </h1>
          <p className="mt-5 max-w-[62ch] text-lead text-vsc-textMuted leading-relaxed">
            Concepts, best practices, and code recipes across Python, SQL, PySpark,
            Databricks, and the Azure data stack. Every topic is a self-contained
            recipe you can copy and ship.
          </p>
          <div className="mt-7 flex items-center gap-3">
            <div className="inline-flex items-center gap-2 h-10 pl-4 pr-2.5 rounded-full2 bg-vsc-panel border border-vsc-border text-body2 text-vsc-textMuted">
              <CommandIcon className="w-3.5 h-3.5 text-vsc-accent" />
              <span>Press</span>
              <kbd className="kbd-chip">{isMac ? "\u2318" : "Ctrl"}</kbd>
              <kbd className="kbd-chip">K</kbd>
              <span>to search anywhere</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recently updated */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="flex items-center gap-2 text-h3 text-vsc-heading">
            <Clock className="w-4 h-4 text-vsc-accent" />
            Recently updated
          </h2>
          <span className="tabular text-[11px] text-vsc-textDim">
            {recent.length} of {DOCS.length}
          </span>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-md2 border border-vsc-borderHair bg-vsc-panel p-10 text-center text-vsc-textMuted text-body2">
            No entries yet.
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recent.map(doc => (
              <li key={doc.path}>
                <NavLink
                  to={doc.path}
                  className="group block h-full px-4 py-4 rounded-md2 border border-vsc-borderHair bg-vsc-panel hover:bg-vsc-panelElev hover:border-vsc-accent/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vsc-accent"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center h-5 px-2 rounded-full2 bg-vsc-accentSoft text-vsc-accent text-[10.5px] font-medium tracking-wide">
                      {labelFromSlug(doc.category)}
                    </span>
                    <time className="tabular text-[11px] text-vsc-textDim">
                      {doc.updated}
                    </time>
                  </div>
                  <div className="text-vsc-heading font-medium truncate">
                    {doc.title}
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-vsc-textDim group-hover:text-vsc-accent transition-colors">
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
