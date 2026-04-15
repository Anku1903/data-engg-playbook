import { lazy, Suspense, useState } from "react";
import { Upload } from "lucide-react";

// Lazy-load the dialog so gray-matter's client parser + Radix Dialog only
// load when the user actually clicks "Upload".
const UploadDialog = lazy(() => import("./UploadDialog"));

export default function UploadButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group w-full flex items-center justify-center gap-2 h-10 px-3.5 rounded-md2 bg-vsc-accentSoft border border-vsc-accent/30 text-vsc-accent hover:bg-vsc-accent/20 hover:border-vsc-accent/60 transition-colors ring-focus"
      >
        <Upload className="w-3.5 h-3.5" strokeWidth={2.25} />
        <span className="text-body2 font-medium">Upload knowledge file</span>
      </button>

      {open && (
        <Suspense fallback={null}>
          <UploadDialog open={open} onOpenChange={setOpen} />
        </Suspense>
      )}
    </>
  );
}
