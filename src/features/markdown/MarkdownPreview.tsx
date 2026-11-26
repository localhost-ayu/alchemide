import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEditorStore } from "../../lib/editorStore";

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
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
      </article>
    </div>
  );
}
