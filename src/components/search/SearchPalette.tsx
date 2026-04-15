import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { Search, CornerDownLeft, ArrowUp, ArrowDown, X } from "lucide-react";
import { runSearch, makeSnippet } from "../../lib/search";
import { DOCS_BY_PATH } from "../../lib/content";
import { labelFromSlug } from "../../lib/slug";

interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
    } else {
      // Focus input on open (cmdk should do this but we want it deterministic).
      const id = window.setTimeout(() => inputRef.current?.focus(), 10);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const hits = useMemo(() => runSearch(deferredQuery), [deferredQuery]);
  const hasQuery = deferredQuery.trim().length > 0;
  const resultCount = hits.length;

  const handleSelect = useCallback(
    (path: string) => {
      navigate(path);
      onClose();
    },
    [navigate, onClose],
  );

  const onClear = useCallback(() => {
    setQuery("");
    inputRef.current?.focus();
  }, []);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={v => {
        if (!v) onClose();
      }}
      label="Search the playbook"
      className="fixed inset-0 z-50"
      overlayClassName="fixed inset-0 bg-black/65 backdrop-blur-md animate-fade-backdrop"
      contentClassName="fixed left-1/2 top-[14%] -translate-x-1/2 w-[660px] max-w-[92vw] bg-vsc-panel border border-vsc-border shadow-elev-4 rounded-lg2 overflow-hidden animate-scale-in"
      shouldFilter={false}
    >
      {/* Search input row */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-vsc-borderHair bg-vsc-panel">
        <Search className="w-[18px] h-[18px] text-vsc-accent shrink-0" strokeWidth={2.25} />
        <Command.Input
          ref={inputRef}
          value={query}
          onValueChange={setQuery}
          placeholder="Search across all categories, tags, and code recipes…"
          className="flex-1 bg-transparent placeholder:text-vsc-textDim outline-none border-0 text-[15px] leading-none caret-vsc-accent font-sans"
          style={{
            color: "#ffffff",
            background: "transparent",
            WebkitTextFillColor: "#ffffff",
            caretColor: "#A8C7FA",
          }}
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center justify-center w-6 h-6 rounded-full2 text-vsc-textDim hover:text-vsc-text hover:bg-vsc-hover transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Live echo / result meta row */}
      <div className="flex items-center justify-between px-5 py-2 bg-vsc-sidebar border-b border-vsc-borderHair min-h-[36px]">
        {hasQuery ? (
          <>
            <div className="flex items-center gap-2 text-body2 text-vsc-textMuted min-w-0">
              <span className="text-vsc-textDim shrink-0">Query</span>
              <span className="font-mono text-vsc-accent truncate">
                “{deferredQuery}”
              </span>
            </div>
            <div className="tabular text-[11px] text-vsc-textDim shrink-0 ml-3">
              {resultCount} {resultCount === 1 ? "result" : "results"}
            </div>
          </>
        ) : (
          <div className="text-body2 text-vsc-textDim">
            Start typing to search titles, headings, tags, and content
          </div>
        )}
      </div>

      {/* Results */}
      <Command.List className="max-h-[52vh] overflow-y-auto py-1.5">
        {hasQuery && resultCount === 0 && (
          <Command.Empty className="px-5 py-10 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full2 bg-vsc-panelElev mb-3">
              <Search className="w-4 h-4 text-vsc-textDim" />
            </div>
            <div className="text-body text-vsc-text">
              No results for{" "}
              <span className="font-mono text-vsc-accent">“{deferredQuery}”</span>
            </div>
            <div className="mt-1 text-body2 text-vsc-textDim">
              Try a different term or fewer characters.
            </div>
          </Command.Empty>
        )}

        {!hasQuery && (
          <div className="px-5 py-8 text-center">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-full2 bg-vsc-accentSoft mb-3">
              <Search className="w-[18px] h-[18px] text-vsc-accent" />
            </div>
            <div className="text-body text-vsc-text">Search the playbook</div>
            <div className="mt-1 text-body2 text-vsc-textDim">
              Fuzzy matches across all documents
            </div>
          </div>
        )}

        {hasQuery &&
          hits.map((hit, idx) => {
            const path = hit.id as string;
            const doc = DOCS_BY_PATH.get(path);
            const snippet = doc ? makeSnippet(doc.body, deferredQuery) : "";
            const categoryLabel = labelFromSlug(String(hit.category));
            return (
              <Command.Item
                key={path}
                value={`${path}__${idx}`}
                onSelect={() => handleSelect(path)}
                className="group mx-2 my-0.5 flex items-start gap-3 px-3 py-2.5 rounded-md2 cursor-pointer text-vsc-text data-[selected=true]:bg-vsc-accentSoft"
              >
                {/* Category chip */}
                <span className="mt-0.5 inline-flex items-center h-5 px-2 rounded-full2 bg-vsc-panelElev border border-vsc-border text-[10.5px] font-mono uppercase tracking-[0.08em] text-vsc-textMuted group-data-[selected=true]:text-vsc-accent group-data-[selected=true]:border-vsc-accent/40 shrink-0">
                  {categoryLabel}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="text-body font-semibold text-vsc-heading truncate">
                    {String(hit.title)}
                  </div>
                  {snippet && (
                    <div className="mt-0.5 text-body2 text-vsc-textMuted line-clamp-2">
                      {snippet}
                    </div>
                  )}
                </div>

                {/* Enter hint on selected row */}
                <CornerDownLeft className="mt-1 w-3.5 h-3.5 text-vsc-textFaint opacity-0 group-data-[selected=true]:opacity-100 shrink-0" />
              </Command.Item>
            );
          })}
      </Command.List>

      {/* Footer hint bar */}
      <div className="flex items-center justify-between gap-4 px-5 h-10 bg-vsc-sidebar border-t border-vsc-borderHair text-[11px] text-vsc-textDim">
        <div className="flex items-center gap-3">
          <HintKey>
            <ArrowUp className="w-3 h-3" />
            <ArrowDown className="w-3 h-3" />
          </HintKey>
          <span>navigate</span>
          <HintKey>
            <CornerDownLeft className="w-3 h-3" />
          </HintKey>
          <span>open</span>
          <HintKey>esc</HintKey>
          <span>close</span>
        </div>
        <div className="font-mono text-[10.5px] text-vsc-textFaint">
          Data Engineering Playbook
        </div>
      </div>
    </Command.Dialog>
  );
}

function HintKey({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-0.5 h-5 min-w-[20px] px-1.5 rounded-xs2 bg-vsc-panelElev border border-vsc-border text-vsc-textMuted font-mono uppercase tracking-[0.04em]">
      {children}
    </span>
  );
}
