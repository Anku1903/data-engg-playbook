import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import CodeBlock from "./CodeBlock";

interface MarkdownViewProps {
  source: string;
}

export default function MarkdownView({ source }: MarkdownViewProps) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]]}
        components={{
          code({ inline, className, children, ...props }: any) {
            const lang = /language-(\w+)/.exec(className || "")?.[1] ?? "text";
            if (inline) {
              return (
                <code
                  className="px-1 py-0.5 rounded bg-vsc-panel text-vsc-inlineCode font-mono text-[0.9em]"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <CodeBlock
                language={lang}
                value={String(children).replace(/\n$/, "")}
              />
            );
          },
          h1: ({ node: _n, ...p }: any) => (
            <h1 className="text-h1 text-vsc-heading mt-8 mb-4 scroll-mt-16" {...p} />
          ),
          h2: ({ node: _n, ...p }: any) => (
            <h2
              className="text-h2 text-vsc-heading mt-8 mb-3 pb-2 border-b border-vsc-borderSoft scroll-mt-16"
              {...p}
            />
          ),
          h3: ({ node: _n, ...p }: any) => (
            <h3 className="text-h3 text-vsc-heading mt-6 mb-2 scroll-mt-16" {...p} />
          ),
          p: ({ node: _n, ...p }: any) => (
            <p className="my-4 text-vsc-text" {...p} />
          ),
          a: ({ node: _n, ...p }: any) => (
            <a
              className="text-vsc-accent hover:text-vsc-accentHover underline underline-offset-2"
              {...p}
            />
          ),
          ul: ({ node: _n, ...p }: any) => (
            <ul className="list-disc pl-6 my-4 space-y-1" {...p} />
          ),
          ol: ({ node: _n, ...p }: any) => (
            <ol className="list-decimal pl-6 my-4 space-y-1" {...p} />
          ),
          table: ({ node: _n, ...p }: any) => (
            <div className="my-6 overflow-x-auto">
              <table className="w-full text-body2 border border-vsc-border" {...p} />
            </div>
          ),
          th: ({ node: _n, ...p }: any) => (
            <th
              className="text-left px-3 py-2 bg-vsc-panel border-b border-vsc-border text-vsc-heading font-semibold"
              {...p}
            />
          ),
          td: ({ node: _n, ...p }: any) => (
            <td className="px-3 py-2 border-b border-vsc-borderSoft align-top" {...p} />
          ),
          blockquote: ({ node: _n, ...p }: any) => (
            <blockquote
              className="border-l-4 border-vsc-accent pl-4 my-4 text-vsc-textMuted italic"
              {...p}
            />
          ),
          hr: () => <hr className="my-8 border-vsc-borderSoft" />,
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
