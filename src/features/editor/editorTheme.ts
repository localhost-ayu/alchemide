import { EditorView } from "@codemirror/view";

export const editorTheme = EditorView.theme(
  {
    "&": {
      height: "100%",
      color: "#e9e4f5",
      backgroundColor: "transparent",
      fontSize: "14px",
    },
    ".cm-scroller": {
      fontFamily: '"Maple Mono", "Cascadia Code", "JetBrains Mono", ui-monospace, monospace',
      lineHeight: "1.6",
    },
    ".cm-content": { caretColor: "#b6f24a" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#b6f24a" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor: "#3a3150",
    },
    ".cm-activeLine": { backgroundColor: "#1b172680" },
    ".cm-gutters": { backgroundColor: "transparent", color: "#5a5270", border: "none" },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: "#c9b8ff" },
    "&.cm-focused .cm-matchingBracket": { backgroundColor: "#b6f24a33", outline: "none" },
  },
  { dark: true },
);
