import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Layers, Menu, Search, X, ChevronUp, ChevronDown } from "lucide-react";
import {
  clearHighlights,
  highlightMatches,
  setActiveMark,
} from "../lib/inPageSearch";

interface TopBarProps {
  onOpenMenu: () => void;
}

function TopBarImpl({ onOpenMenu }: TopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<HTMLElement[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset highlights whenever the search panel closes.
  useEffect(() => {
    if (!searchOpen) {
      clearHighlights();
      setHits([]);
      setQuery("");
      setSearched(false);
      setActiveIdx(0);
    } else {
      window.setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [searchOpen]);

  // Clear highlights when the user navigates to a different doc.
  useEffect(() => {
    return () => clearHighlights();
  }, []);

  const runSearch = useCallback(() => {
    const marks = highlightMatches(query);
    setHits(marks);
    setSearched(true);
    if (marks.length > 0) {
      setActiveIdx(0);
      setActiveMark(marks, 0);
    } else {
      setActiveIdx(0);
    }
  }, [query]);

  const onSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      runSearch();
    },
    [runSearch],
  );

  const next = useCallback(() => {
    if (hits.length === 0) return;
    const idx = (activeIdx + 1) % hits.length;
    setActiveIdx(idx);
    setActiveMark(hits, idx);
  }, [hits, activeIdx]);

  const prev = useCallback(() => {
    if (hits.length === 0) return;
    const idx = (activeIdx - 1 + hits.length) % hits.length;
    setActiveIdx(idx);
    setActiveMark(hits, idx);
  }, [hits, activeIdx]);

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <header
      className="col-span-2 row-start-1 flex items-center gap-2 sm:gap-4 pl-3 sm:pl-6 pr-2 sm:pr-4 bg-vsc-bg border-b border-vsc-borderHair z-30"
      style={{ height: "64px" }}
    >
      {/* Hamburger (mobile only) */}
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-full2 text-vsc-text hover:bg-vsc-hover transition-colors ring-focus"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Brand */}
      {!searchOpen && (
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-md2 bg-vsc-accentSoft shrink-0"
            aria-hidden="true"
          >
            <Layers className="w-[18px] h-[18px] text-vsc-accent" strokeWidth={2.25} />
          </div>
          <div className="flex flex-col leading-none min-w-0">
            <span className="font-display text-[14px] sm:text-[15px] font-semibold tracking-tight text-vsc-heading truncate">
              Data Engineering Playbook
            </span>
            <span className="mt-1 text-[11px] text-vsc-textDim truncate hidden sm:block">
              Personal reference library
            </span>
          </div>
        </div>
      )}

      {/* In-page search — either the icon button or the expanded form */}
      <div className="ml-auto flex items-center gap-2 min-w-0 flex-1 sm:flex-none justify-end">
        {!searchOpen ? (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Find in page"
            className="flex items-center justify-center w-10 h-10 rounded-full2 text-vsc-text hover:bg-vsc-hover transition-colors ring-focus"
          >
            <Search className="w-5 h-5" />
          </button>
        ) : (
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto h-11 pl-3 pr-1.5 rounded-full2 bg-vsc-panel border border-vsc-border shadow-elev-1 animate-fade-in"
          >
            <Search className="w-4 h-4 text-vsc-accent shrink-0" strokeWidth={2.25} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Find in current page…"
              className="flex-1 sm:w-[240px] bg-transparent outline-none border-0 text-[14px] font-sans"
              style={{
                color: "#ffffff",
                WebkitTextFillColor: "#ffffff",
                caretColor: "#A8C7FA",
              }}
            />

            {/* Match count + nav (only after a search has run) */}
            {searched && (
              <div className="flex items-center gap-1 shrink-0">
                <span className="tabular text-[11px] text-vsc-textDim min-w-[32px] text-right">
                  {hits.length === 0 ? "0/0" : `${activeIdx + 1}/${hits.length}`}
                </span>
                <button
                  type="button"
                  onClick={prev}
                  disabled={hits.length === 0}
                  aria-label="Previous match"
                  className="flex items-center justify-center w-7 h-7 rounded-full2 text-vsc-textMuted hover:text-vsc-text hover:bg-vsc-hover disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  disabled={hits.length === 0}
                  aria-label="Next match"
                  className="flex items-center justify-center w-7 h-7 rounded-full2 text-vsc-textMuted hover:text-vsc-text hover:bg-vsc-hover disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="submit"
              className="shrink-0 h-8 px-3 rounded-full2 bg-vsc-accent text-vsc-onAccent text-[12px] font-semibold hover:bg-vsc-accentHover transition-colors ring-focus"
            >
              Search
            </button>
            <button
              type="button"
              onClick={closeSearch}
              aria-label="Close search"
              className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full2 text-vsc-textMuted hover:text-vsc-text hover:bg-vsc-hover transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </header>
  );
}

const TopBar = memo(TopBarImpl);
export default TopBar;
