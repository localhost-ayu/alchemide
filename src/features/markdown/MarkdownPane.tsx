import { useEffect } from "react";
import { registerCommands } from "../../lib/commands";
import { selectActiveTab, selectActiveText, useEditorStore } from "../../lib/editorStore";
import { MarkdownPreview } from "./MarkdownPreview";
import { usePreviewStore } from "./usePreviewStore";
import "./Markdown.css";

export function MarkdownPane() {
  const isOpen = usePreviewStore((state) => state.isOpen);
  const isMarkdown = useEditorStore((state) => selectActiveTab(state)?.language === "markdown");
  const source = useEditorStore(selectActiveText);

  useEffect(
    () =>
      registerCommands([
        {
          id: "markdown.togglePreview",
          title: "Toggle Markdown preview",
          keys: "Ctrl+Shift+V",
          run: () => usePreviewStore.getState().toggle(),
        },
      ]),
    [],
  );

  if (!isOpen || !isMarkdown || source === null) {
    return null;
  }
  return (
    <section className="markdown-pane" aria-label="Markdown preview">
      <MarkdownPreview source={source} />
    </section>
  );
}
