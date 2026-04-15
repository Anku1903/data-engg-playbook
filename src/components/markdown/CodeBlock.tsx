import { memo, useCallback, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  language: string;
  value: string;
}

// Hoisted to avoid re-creating on every render.
const CUSTOM_STYLE: React.CSSProperties = {
  margin: 0,
  padding: "18px 18px",
  background: "transparent",
  fontSize: "13px",
  lineHeight: "1.65",
};

const CODE_TAG_PROPS = {
  style: { fontFamily: '"JetBrains Mono", ui-monospace, monospace' },
};

function CodeBlockImpl({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // no-op
    }
  }, [value]);

  return (
    <div className="my-6 rounded-md2 overflow-hidden border border-vsc-border bg-vsc-codeBg shadow-elev-1">
      {/* Header row: language pill + copy button */}
      <div className="flex items-center justify-between h-10 px-3.5 bg-vsc-panelElev border-b border-vsc-borderHair">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full2 bg-vsc-accent" />
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-vsc-textMuted">
              {language || "text"}
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={onCopy}
          aria-label="Copy code"
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-full2 text-vsc-textMuted hover:text-vsc-text hover:bg-vsc-hover transition-colors ring-focus"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-vsc-success" />
              <span className="text-[11px] font-medium text-vsc-success">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Copy</span>
            </>
          )}
        </button>
      </div>

      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={CUSTOM_STYLE}
        codeTagProps={CODE_TAG_PROPS}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

const CodeBlock = memo(CodeBlockImpl);
export default CodeBlock;
