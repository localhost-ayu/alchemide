import { EditorView } from "@codemirror/view";

export const editorTheme = EditorView.theme(
  {
    "&": {
      height: "100%",
      color: "var(--color-text)",
      backgroundColor: "transparent",
      fontSize: "var(--editor-font-size, 14px)",
    },
    ".cm-scroller": {
      fontFamily: "var(--font-code)",
      lineHeight: "var(--editor-line-height, 1.6)",
      fontVariantLigatures: "var(--code-ligatures, normal)",
    },
    ".cm-content": { caretColor: "var(--color-accent)" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--color-accent)" },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground":
      { backgroundColor: "var(--color-selection)" },
    ".cm-activeLine": {
      backgroundColor: "color-mix(in srgb, var(--color-panel) 50%, transparent)",
    },
    ".cm-gutters": { backgroundColor: "transparent", color: "var(--color-faint)", border: "none" },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--syntax-variable)" },
    ".cm-tooltip": {
      backgroundColor: "var(--color-panel)",
      color: "var(--color-text)",
      border: "1px solid var(--color-border)",
      borderRadius: "6px",
      boxShadow: "0 8px 24px color-mix(in srgb, var(--color-bg) 60%, transparent)",
    },
    ".cm-tooltip-autocomplete > ul": { fontFamily: "var(--font-code)" },
    ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
      backgroundColor: "var(--color-selected)",
      color: "var(--color-text)",
    },
    ".cm-completionDetail": { color: "var(--color-muted)" },
    ".cm-completionMatchedText": { color: "var(--color-accent)", textDecoration: "none" },
    ".cm-diagnostic": { borderLeftColor: "var(--color-muted)" },
    ".cm-diagnostic-error": { borderLeftColor: "var(--color-error)" },
    ".cm-diagnostic-warning": { borderLeftColor: "var(--color-warning)" },
    ".cm-panels": {
      backgroundColor: "var(--color-panel)",
      color: "var(--color-text)",
      borderColor: "var(--color-border)",
    },
    "&.cm-focused .cm-matchingBracket": {
      backgroundColor: "color-mix(in srgb, var(--color-accent) 20%, transparent)",
      outline: "none",
    },
  },
  { dark: true },
);
