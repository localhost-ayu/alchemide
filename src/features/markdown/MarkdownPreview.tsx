import { useEffect, useRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEditorStore } from "../../lib/editorStore";
import { openExternal } from "../../lib/ipc";
import { CodeBlock } from "./CodeBlock";
import { codeLanguage } from "./codeLanguage";
import { linkKind } from "./linkKind";
import { PreviewImage } from "./PreviewImage";

const components: Components = {
  a({ href, children }) {
    const kind = linkKind(href);
    if (kind === "anchor") {
      return <a href={href}>{children}</a>;
    }
    return (
      <a
        href={href}
        title={href}
        onClick={(event) => {
          event.preventDefault();
          if (kind === "external" && href) {
            openExternal(href).catch(() => {});
          }
        }}
      >
        {children}
      </a>
    );
  },
  img({ src, alt }) {
    return <PreviewImage src={typeof src === "string" ? src : undefined} alt={alt} />;
  },
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
