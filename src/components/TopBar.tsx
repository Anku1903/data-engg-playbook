import { memo, useMemo } from "react";
import { Search, Layers } from "lucide-react";

interface TopBarProps {
  onOpenSearch: () => void;
}

function TopBarImpl({ onOpenSearch }: TopBarProps) {
  const isMac = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      /Mac|iPod|iPhone|iPad/.test(navigator.platform),
    [],
  );

  return (
    <header
      className="col-span-2 row-start-1 flex items-center justify-between gap-6 pl-6 pr-4 bg-vsc-bg border-b border-vsc-borderHair z-20"
      style={{ height: "64px" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-md2 bg-vsc-accentSoft"
          aria-hidden="true"
        >
          <Layers className="w-[18px] h-[18px] text-vsc-accent" strokeWidth={2.25} />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-semibold tracking-tight text-vsc-heading">
            Data Engineering Playbook
          </span>
          <span className="mt-1 text-[11px] text-vsc-textDim">
            Personal reference library
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenSearch}
        className="group flex items-center gap-2.5 pl-3.5 pr-2 h-10 rounded-full2 bg-vsc-panel border border-vsc-border text-vsc-textMuted hover:bg-vsc-panelElev hover:border-vsc-accent/40 hover:text-vsc-text transition-colors ring-focus"
        style={{ minWidth: "360px" }}
        aria-label="Open search palette"
      >
        <Search className="w-4 h-4 text-vsc-textDim group-hover:text-vsc-accent transition-colors" />
        <span className="text-body flex-1 text-left">Search the playbook…</span>
        <span className="flex items-center gap-1 pr-1">
          <kbd className="kbd-chip">{isMac ? "\u2318" : "Ctrl"}</kbd>
          <kbd className="kbd-chip">K</kbd>
        </span>
      </button>
    </header>
  );
}

const TopBar = memo(TopBarImpl);
export default TopBar;
