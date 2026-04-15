import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { FileUp, FileText, Check, X, Wand2 } from "lucide-react";
import Modal from "../ui/Modal";
import { CATEGORIES } from "../../lib/categories";
import type { CategorySlug } from "../../lib/types";
import {
  type ParsedPreview,
  uploadFile,
  validateUpload,
} from "../../lib/upload";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Stage =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "ready"; parsed: ParsedPreview; finalContents: string }
  | { kind: "uploading" };

export default function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const [category, setCategory] = useState<CategorySlug>(CATEGORIES[0].slug);
  const [filename, setFilename] = useState<string>("");
  const [rawContents, setRawContents] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File, cat: CategorySlug) => {
      const text = await file.text();
      setFilename(file.name);
      setRawContents(text);
      const result = validateUpload(cat, file.name, text);
      if (!result.ok) {
        setStage({ kind: "error", message: result.error });
      } else {
        setStage({
          kind: "ready",
          parsed: result.parsed,
          finalContents: result.finalContents,
        });
      }
    },
    [],
  );

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      void processFile(file, category);
    },
    [category, processFile],
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      void processFile(file, category);
    },
    [category, processFile],
  );

  const onCategoryChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const next = e.target.value as CategorySlug;
      setCategory(next);
      // If a file is already loaded, re-validate against the new category.
      if (rawContents && filename) {
        const result = validateUpload(next, filename, rawContents);
        if (!result.ok) setStage({ kind: "error", message: result.error });
        else
          setStage({
            kind: "ready",
            parsed: result.parsed,
            finalContents: result.finalContents,
          });
      }
    },
    [rawContents, filename],
  );

  const onSubmit = useCallback(async () => {
    if (stage.kind !== "ready") return;
    const payload = stage.finalContents;
    setStage({ kind: "uploading" });
    const res = await uploadFile(category, filename, payload);
    if (res.ok) {
      toast.success("Added to playbook", {
        description: `${filename} → ${category}. Sidebar will refresh automatically.`,
      });
      onOpenChange(false);
      // Reset state on close.
      setTimeout(() => {
        setFilename("");
        setRawContents("");
        setStage({ kind: "idle" });
      }, 200);
    } else {
      setStage({ kind: "error", message: res.error ?? "Upload failed" });
      toast.error("Upload rejected", { description: res.error });
    }
  }, [stage, category, filename, onOpenChange]);

  const canSubmit = stage.kind === "ready";

  const categoryOptions = useMemo(
    () =>
      CATEGORIES.map(c => (
        <option key={c.slug} value={c.slug}>
          {c.label}
        </option>
      )),
    [],
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Upload knowledge file"
      description="Drop a .md file. Frontmatter is auto-generated if missing."
      widthClass="w-[580px]"
    >
      <div className="space-y-5">
        {/* Category */}
        <div>
          <label
            htmlFor="upload-category"
            className="block font-mono text-[10.5px] uppercase tracking-[0.14em] text-vsc-textDim mb-1.5"
          >
            Category
          </label>
          <div className="relative">
            <select
              id="upload-category"
              value={category}
              onChange={onCategoryChange}
              className="w-full appearance-none h-11 px-3.5 pr-9 rounded-md2 bg-vsc-panel border border-vsc-border text-vsc-text text-body hover:bg-vsc-panelElev hover:border-vsc-accent/40 transition-colors ring-focus"
            >
              {categoryOptions}
            </select>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-vsc-textDim"
            >
              ▾
            </span>
          </div>
        </div>

        {/* Drop zone / picker */}
        <div>
          <label className="block font-mono text-[10.5px] uppercase tracking-[0.14em] text-vsc-textDim mb-1.5">
            Markdown file
          </label>
          <div
            onDragOver={e => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={[
              "relative flex flex-col items-center justify-center gap-2 h-[124px] rounded-md2",
              "border border-dashed cursor-pointer transition-colors",
              dragActive
                ? "bg-vsc-accentSoft border-vsc-accent text-vsc-text"
                : "bg-vsc-panel border-vsc-border text-vsc-textMuted hover:bg-vsc-panelElev hover:border-vsc-accent/40 hover:text-vsc-text",
            ].join(" ")}
          >
            <FileUp className="w-5 h-5 text-vsc-textDim" strokeWidth={1.75} />
            <div className="text-body2">
              {filename ? (
                <span className="font-mono text-vsc-text">{filename}</span>
              ) : (
                <>
                  <span>Drop a </span>
                  <span className="font-mono text-vsc-inlineCode">.md</span>
                  <span> file, or click to browse</span>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,text/markdown"
              onChange={onFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Preview / error */}
        {stage.kind === "error" && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-md2 bg-[rgba(242,184,181,0.08)] border border-[rgba(242,184,181,0.3)]">
            <X className="w-4 h-4 text-vsc-error mt-0.5 shrink-0" />
            <div className="text-body2 text-vsc-error">{stage.message}</div>
          </div>
        )}

        {stage.kind === "ready" && (
          <div className="rounded-md2 border border-vsc-borderHair bg-vsc-panel overflow-hidden">
            <div className="flex items-center gap-2 px-3 h-9 bg-vsc-panelElev border-b border-vsc-borderHair">
              <FileText className="w-3.5 h-3.5 text-vsc-accent" />
              <span className="font-mono text-[11px] text-vsc-textMuted">
                {stage.parsed.autoGenerated ? "Frontmatter (auto-generated)" : "Parsed frontmatter"}
              </span>
              {stage.parsed.autoGenerated ? (
                <span className="ml-auto inline-flex items-center gap-1 h-5 px-2 rounded-full2 bg-vsc-accentSoft text-vsc-accent text-[10px] font-medium">
                  <Wand2 className="w-3 h-3" />
                  Auto
                </span>
              ) : (
                <Check className="ml-auto w-3.5 h-3.5 text-vsc-success" />
              )}
            </div>
            <dl className="divide-y divide-vsc-borderHair text-body2">
              <PreviewRow k="title" v={stage.parsed.title} />
              <PreviewRow k="category" v={stage.parsed.category} mono />
              <PreviewRow k="subcategory" v={stage.parsed.subcategory} mono />
              <PreviewRow k="tags" v={stage.parsed.tags.join(", ") || "—"} mono />
              <PreviewRow k="updated" v={stage.parsed.updated} mono />
            </dl>
            <div className="border-t border-vsc-borderHair px-3 py-2 bg-vsc-codeBg">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-vsc-textDim mb-1">
                Body preview
              </div>
              <pre className="font-mono text-[11.5px] text-vsc-textMuted whitespace-pre-wrap leading-relaxed max-h-[88px] overflow-hidden">
                {stage.parsed.bodyPreview}
              </pre>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 rounded-md2 text-body2 text-vsc-textMuted hover:text-vsc-text hover:bg-vsc-hover transition-colors ring-focus"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className={[
              "h-9 px-4 rounded-md2 text-body2 font-medium transition-colors ring-focus",
              canSubmit
                ? "bg-vsc-accent text-white hover:bg-vsc-accentHover"
                : "bg-vsc-panel text-vsc-textFaint cursor-not-allowed border border-vsc-borderHair",
            ].join(" ")}
          >
            {stage.kind === "uploading" ? "Adding…" : "Add to playbook"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface PreviewRowProps {
  k: string;
  v: string;
  mono?: boolean;
}

function PreviewRow({ k, v, mono }: PreviewRowProps) {
  return (
    <div className="grid grid-cols-[112px_1fr] gap-3 px-3 py-1.5">
      <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-vsc-textDim">
        {k}
      </dt>
      <dd className={mono ? "font-mono text-vsc-text" : "text-vsc-text"}>{v}</dd>
    </div>
  );
}
