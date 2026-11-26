import { useEffect, useRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEditorStore } from "../../lib/editorStore";
import { CodeBlock } from "./CodeBlock";
import { codeLanguage } from "./codeLanguage";

const components: Components = {
  code({ className, children }) {
    const language = codeLanguage(className);
    const code = String(children ?? "").replace(/\n$/, "");
    if (!language) {
      return <code className={className}>{children}</code>;
    }
    return <CodeBlock code={code} language={language} />;
  },
};

type MarkdownPreviewProps = {
  source: string;
};

export function MarkdownPreview({ source }: MarkdownPreviewProps) {
  const scroll = useEditorStore((state) => state.scroll);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = scroll * (container.scrollHeight - container.clientHeight);
  }, [scroll]);

  return (
    <div ref={containerRef} className="markdown-preview">
      <article className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {source}
        </ReactMarkdown>
      </article>
    </div>
  );
}
