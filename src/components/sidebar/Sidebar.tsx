import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, BookOpen, X } from "lucide-react";
import { SIDEBAR } from "../../lib/content";
import type { Category, Subcategory } from "../../lib/types";
import UploadButton from "../upload/UploadButton";

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

// Two-dropdown sidebar: Category + Subcategory + UploadButton directly below.
// Responsive: sticky on md+, drawer on mobile.
function SidebarImpl({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { routeCategory, routeSubcategory } = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return {
      routeCategory: parts[0] ?? "",
      routeSubcategory: parts[1] ?? "",
    };
  }, [pathname]);

  const initialCategory =
    routeCategory ||
    SIDEBAR.find(c => c.subcategories.length > 0)?.slug ||
    SIDEBAR[0].slug;

  const [category, setCategory] = useState<string>(initialCategory);

  useEffect(() => {
    if (routeCategory && routeCategory !== category) setCategory(routeCategory);
  }, [routeCategory, category]);

  const activeCategory: Category | undefined = useMemo(
    () => SIDEBAR.find(c => c.slug === category),
    [category],
  );

  const subcategories = activeCategory?.subcategories ?? [];

  const onCategoryChange = useCallback((slug: string) => {
    setCategory(slug);
  }, []);

  const onSubcategoryChange = useCallback(
    (sub: Subcategory) => {
      navigate(sub.path);
      onCloseMobile();
    },
    [navigate, onCloseMobile],
  );

  const totalDocs = useMemo(
    () => SIDEBAR.reduce((n, c) => n + c.subcategories.length, 0),
    [],
  );

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/65 backdrop-blur-sm animate-fade-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          // Desktop: sticky grid column
          "md:row-start-2 md:col-start-1 md:static md:translate-x-0",
          // Mobile: fixed drawer
          "fixed top-0 bottom-0 left-0 z-50 w-[86vw] max-w-[320px] md:max-w-none md:w-auto",
          "flex flex-col bg-vsc-sidebar border-r border-vsc-borderHair overflow-hidden",
          "transition-transform duration-250 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {/* Header (with close on mobile) */}
        <div className="flex items-center gap-2 px-5 pt-5 pb-1">
          <BookOpen className="w-4 h-4 text-vsc-accent" strokeWidth={2} />
          <span className="font-display text-[13px] font-semibold tracking-tight text-vsc-heading">
            Playbook
          </span>
          <span className="ml-auto tabular text-[11px] text-vsc-textDim">
            {totalDocs}
          </span>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="md:hidden -mr-1 flex items-center justify-center w-7 h-7 rounded-full2 text-vsc-textMuted hover:text-vsc-text hover:bg-vsc-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="px-5 pb-4 text-[11.5px] text-vsc-textDim leading-snug">
          Browse by category
        </p>

        {/* Dropdowns + upload */}
        <div className="px-4 space-y-3 overflow-y-auto">
          <CategorySelect
            value={category}
            onChange={onCategoryChange}
            categories={SIDEBAR}
          />
          <SubcategorySelect
            category={category}
            value={routeSubcategory}
            onChange={onSubcategoryChange}
            subcategories={subcategories}
          />

          {/* Upload right under subcategory */}
          <div className="pt-1">
            <UploadButton />
          </div>

          {/* Active reading hint */}
          {activeCategory && routeSubcategory && (
            <div className="mt-2 px-3 py-2.5 rounded-md2 bg-vsc-accentSoft border border-vsc-accent/20">
              <div className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-vsc-accent">
                Reading
              </div>
              <div className="mt-0.5 text-body2 text-vsc-text truncate">
                {subcategories.find(s => s.slug === routeSubcategory)?.title ??
                  routeSubcategory}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1" />
      </aside>
    </>
  );
}

const Sidebar = memo(SidebarImpl);
export default Sidebar;

// ---------- Category select ----------

interface CategorySelectProps {
  value: string;
  onChange: (slug: string) => void;
  categories: Category[];
}

function CategorySelect({ value, onChange, categories }: CategorySelectProps) {
  const [open, setOpen] = useState(false);

  const activeLabel = useMemo(
    () => categories.find(c => c.slug === value)?.label ?? "Select category",
    [categories, value],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest?.("[data-cat-select]")) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div data-cat-select className="relative">
      <label className="block text-[10.5px] font-mono uppercase tracking-[0.14em] text-vsc-textDim mb-1.5">
        Category
      </label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="group w-full flex items-center gap-2 h-11 px-3.5 rounded-md2 bg-vsc-panel border border-vsc-border text-vsc-text text-body hover:bg-vsc-panelElev hover:border-vsc-accent/40 transition-colors ring-focus"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex-1 text-left truncate">{activeLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-vsc-textDim transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div
          className="absolute z-40 left-0 right-0 mt-1.5 rounded-md2 bg-vsc-panelElev border border-vsc-border shadow-elev-3 overflow-hidden animate-fade-in max-h-[360px] overflow-y-auto"
          role="listbox"
        >
          {categories.map(c => {
            const count = c.subcategories.length;
            const active = c.slug === value;
            return (
              <button
                key={c.slug}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(c.slug);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3.5 h-10 text-left text-body transition-colors ${
                  active
                    ? "bg-vsc-accentSoft text-vsc-accent"
                    : "text-vsc-text hover:bg-vsc-hover"
                }`}
              >
                <span className="flex-1 truncate">{c.label}</span>
                <span className="tabular text-[11px] text-vsc-textDim">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Subcategory select ----------

interface SubcategorySelectProps {
  category: string;
  value: string;
  onChange: (sub: Subcategory) => void;
  subcategories: Subcategory[];
}

function SubcategorySelect({
  value,
  onChange,
  subcategories,
}: SubcategorySelectProps) {
  const [open, setOpen] = useState(false);
  const empty = subcategories.length === 0;

  const activeLabel = useMemo(() => {
    const m = subcategories.find(s => s.slug === value);
    if (m) return m.title;
    return empty ? "No docs in this category" : "Select a topic";
  }, [subcategories, value, empty]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest?.("[data-sub-select]")) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div data-sub-select className="relative">
      <label className="block text-[10.5px] font-mono uppercase tracking-[0.14em] text-vsc-textDim mb-1.5">
        Topic
      </label>
      <button
        type="button"
        onClick={() => !empty && setOpen(o => !o)}
        disabled={empty}
        className={`w-full flex items-center gap-2 h-11 px-3.5 rounded-md2 border text-body transition-colors ring-focus ${
          empty
            ? "bg-vsc-panel border-vsc-borderHair text-vsc-textFaint cursor-not-allowed"
            : "bg-vsc-panel border-vsc-border text-vsc-text hover:bg-vsc-panelElev hover:border-vsc-accent/40"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex-1 text-left truncate">{activeLabel}</span>
        {!empty && (
          <ChevronDown
            className={`w-4 h-4 text-vsc-textDim transition-transform ${open ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        )}
      </button>

      {open && !empty && (
        <div
          className="absolute z-40 left-0 right-0 mt-1.5 rounded-md2 bg-vsc-panelElev border border-vsc-border shadow-elev-3 overflow-hidden animate-fade-in max-h-[360px] overflow-y-auto"
          role="listbox"
        >
          {subcategories.map(s => {
            const active = s.slug === value;
            return (
              <button
                key={s.slug}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
                className={`w-full flex flex-col items-start gap-0.5 px-3.5 py-2.5 text-left transition-colors ${
                  active
                    ? "bg-vsc-accentSoft text-vsc-accent"
                    : "text-vsc-text hover:bg-vsc-hover"
                }`}
              >
                <span className="text-body truncate w-full">{s.title}</span>
                <span className="font-mono text-[10.5px] text-vsc-textDim truncate w-full">
                  {s.slug}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
