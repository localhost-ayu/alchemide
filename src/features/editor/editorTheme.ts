import { EditorView } from "@codemirror/view";

export const editorTheme = EditorView.theme(
  {
    "&": {
      height: "100%",
      color: "var(--color-text)",
      backgroundColor: "transparent",
      fontSize: "var(--editor-font-size, 14px)",
    },
    ".cm-scroller": { fontFamily: "var(--font-code)", lineHeight: "1.6" },
    ".cm-content": { caretColor: "var(--color-accent)" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--color-accent)" },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground":
      { backgroundColor: "var(--color-selection)" },
    ".cm-activeLine": {
      backgroundColor: "color-mix(in srgb, var(--color-panel) 50%, transparent)",
    },
    ".cm-gutters": { backgroundColor: "transparent", color: "var(--color-faint)", border: "none" },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--syntax-variable)" },
    "&.cm-focused .cm-matchingBracket": {
      backgroundColor: "color-mix(in srgb, var(--color-accent) 20%, transparent)",
      outline: "none",
    },
  },
  { dark: true },
);
