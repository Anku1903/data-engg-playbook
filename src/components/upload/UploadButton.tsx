import { lazy, Suspense, useState } from "react";
import { Upload } from "lucide-react";

// Lazy-load the dialog so gray-matter's client-side parser only loads when the
// user actually opens the upload modal. The dialog module also pulls in Radix
// Dialog internals, which we do not want on first paint.
const UploadDialog = lazy(() => import("./UploadDialog"));

export default function UploadButton() {
  // Hidden entirely in production builds — the dev-only endpoint does not exist.
  if (import.meta.env.PROD) return null;

  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="border-t border-vsc-borderHair p-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group w-full flex items-center gap-2 h-9 px-3 rounded-md2 bg-vsc-panelElev border border-vsc-border text-vsc-textMuted hover:text-vsc-text hover:border-vsc-accent transition-colors ring-focus"
        >
          <Upload
            className="w-3.5 h-3.5 text-vsc-textDim group-hover:text-vsc-accent transition-colors"
            strokeWidth={2}
          />
          <span className="text-body2 flex-1 text-left">Upload knowledge file</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-vsc-textFaint">
            .md
          </span>
        </button>
      </div>

      {open && (
        <Suspense fallback={null}>
          <UploadDialog open={open} onOpenChange={setOpen} />
        </Suspense>
      )}
    </>
  );
}
