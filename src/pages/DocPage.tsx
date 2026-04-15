import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";
import { DOCS_BY_PATH } from "../lib/content";
import { deleteFile } from "../lib/upload";
import type { CategorySlug } from "../lib/types";
import MarkdownView from "../components/markdown/MarkdownView";
import Breadcrumb from "../components/Breadcrumb";
import NotFound from "../components/NotFound";
import Modal from "../components/ui/Modal";

export default function DocPage() {
  const { category, subcategory } = useParams();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const doc = DOCS_BY_PATH.get(`/${category}/${subcategory}`);
  if (!doc) return <NotFound />;

  const filename = `${doc.subcategory}.md`;
  const filePath = `src/content/${doc.category}/${filename}`;

  const handleConfirm = useCallback(async () => {
    setDeleting(true);
    const res = await deleteFile(doc.category as CategorySlug, filename);
    setDeleting(false);

    if (res.manual) {
      toast.info("Remove manually", {
        description: `Delete ${filePath} from your repo and push to redeploy.`,
        duration: 10000,
      });
      setConfirmOpen(false);
      return;
    }

    if (res.ok) {
      toast.success("Deleted", {
        description: `${filename} removed from ${doc.category}.`,
      });
      setConfirmOpen(false);
      navigate("/");
    } else {
      toast.error("Delete failed", {
        description: res.error ?? "Unknown error",
      });
    }
  }, [doc.category, filename, filePath, navigate]);

  return (
    <article className="max-w-3xl mx-auto px-5 sm:px-8 py-6 sm:py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Breadcrumb category={doc.category} doc={doc} />
        </div>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          aria-label="Delete this file"
          className="shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full2 bg-vsc-panel border border-vsc-border text-vsc-textMuted hover:bg-[rgba(242,184,181,0.08)] hover:border-[rgba(242,184,181,0.4)] hover:text-vsc-error transition-colors ring-focus"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
          <span className="text-[12px] font-medium">Delete</span>
        </button>
      </div>

      <h1 className="text-h1 text-vsc-heading mt-3 mb-1">{doc.title}</h1>
      <div className="flex flex-wrap items-center gap-2 text-body2 text-vsc-textDim mb-2">
        <time className="font-mono">Updated {doc.updated}</time>
        {doc.tags.length > 0 && (
          <>
            <span className="text-vsc-textDim">·</span>
            <div className="flex flex-wrap gap-1.5">
              {doc.tags.map(t => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 rounded bg-vsc-panel border border-vsc-borderSoft text-[11px] font-mono text-vsc-textMuted"
                >
                  {t}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
      <hr className="my-4 border-vsc-borderSoft" />
      <MarkdownView source={doc.body} />

      <Modal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this file?"
        description="This removes the markdown file from disk. It cannot be undone."
        widthClass="w-[480px]"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 px-4 py-3 rounded-md2 bg-[rgba(242,184,181,0.08)] border border-[rgba(242,184,181,0.3)]">
            <AlertTriangle className="w-4 h-4 text-vsc-error mt-0.5 shrink-0" strokeWidth={2.25} />
            <div className="min-w-0">
              <div className="text-body2 text-vsc-text">
                About to delete
              </div>
              <div className="mt-0.5 font-mono text-[12px] text-vsc-error truncate">
                {filePath}
              </div>
            </div>
          </div>

          <div className="text-body2 text-vsc-textMuted">
            The sidebar and search will refresh automatically after deletion.
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
              className="h-10 px-4 rounded-full2 text-body text-vsc-textMuted hover:text-vsc-text hover:bg-vsc-hover transition-colors ring-focus disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={deleting}
              className="flex items-center gap-1.5 h-10 px-4 rounded-full2 bg-[rgba(242,184,181,0.14)] border border-[rgba(242,184,181,0.45)] text-vsc-error font-medium text-body hover:bg-[rgba(242,184,181,0.22)] transition-colors ring-focus disabled:opacity-60"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? "Deleting…" : "Delete file"}
            </button>
          </div>
        </div>
      </Modal>
    </article>
  );
}
