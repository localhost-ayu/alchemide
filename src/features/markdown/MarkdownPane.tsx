import { useEffect } from "react";
import { registerCommands } from "../../lib/commands";
import { selectActiveTab, selectActiveText, useEditorStore } from "../../lib/editorStore";
import { useT } from "../../lib/i18n";
import { MarkdownPreview } from "./MarkdownPreview";
import { usePreviewStore } from "./usePreviewStore";
import "./Markdown.css";

export function MarkdownPane() {
  const t = useT();
  const isOpen = usePreviewStore((state) => state.isOpen);
  const isMarkdown = useEditorStore((state) => selectActiveTab(state)?.language === "markdown");
  const source = useEditorStore(selectActiveText);

  useEffect(
    () =>
      registerCommands([
        {
          id: "markdown.togglePreview",
          title: t("markdown.togglePreview"),
          keys: "Ctrl+Shift+V",
          run: () => usePreviewStore.getState().toggle(),
        },
      ]),
    [t],
  );

  if (!isMarkdown || source === null) {
    return null;
  }
  return (
    <>
      <button
        type="button"
        className="markdown-toggle"
        aria-label={t("markdown.togglePreview")}
        aria-pressed={isOpen}
        title={t("markdown.previewShortcut")}
        onClick={() => usePreviewStore.getState().toggle()}
      >
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path
            d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
          />
          <circle cx="8" cy="8" r="2.2" fill="currentColor" />
        </svg>
      </button>
      {isOpen && (
        <section className="markdown-pane" aria-label={t("markdown.preview")}>
          <MarkdownPreview source={source} />
        </section>
      )}
    </>
  );
}
