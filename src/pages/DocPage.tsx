import { useParams } from "react-router-dom";
import { DOCS_BY_PATH } from "../lib/content";
import MarkdownView from "../components/markdown/MarkdownView";
import Breadcrumb from "../components/Breadcrumb";
import NotFound from "../components/NotFound";

export default function DocPage() {
  const { category, subcategory } = useParams();
  const doc = DOCS_BY_PATH.get(`/${category}/${subcategory}`);
  if (!doc) return <NotFound />;

  return (
    <article className="max-w-3xl mx-auto px-8 py-8">
      <Breadcrumb category={doc.category} doc={doc} />
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
    </article>
  );
}
