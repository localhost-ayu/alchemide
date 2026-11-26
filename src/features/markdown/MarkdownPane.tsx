import { useEffect } from "react";
import { selectActiveTab, selectActiveText, useEditorStore } from "../../lib/editorStore";
import { MarkdownPreview } from "./MarkdownPreview";
import { usePreviewStore } from "./usePreviewStore";
import "./Markdown.css";

export function MarkdownPane() {
  const isOpen = usePreviewStore((state) => state.isOpen);
  const isMarkdown = useEditorStore((state) => selectActiveTab(state)?.language === "markdown");
  const source = useEditorStore(selectActiveText);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "v") {
        event.preventDefault();
        usePreviewStore.getState().toggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen || !isMarkdown || source === null) {
    return null;
  }
  return (
    <section className="markdown-pane" aria-label="Markdown preview">
      <MarkdownPreview source={source} />
    </section>
  );
}
