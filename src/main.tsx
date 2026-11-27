import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { initTerminalSettings } from "./features/terminal/useTerminalSettings";
import { initThemes } from "./features/themes/useThemeStore";
import { initEditorSettings } from "./lib/editorSettings";
import { initLayout } from "./lib/layoutStore";
import { useSnippetStore } from "./lib/snippetStore";
import "./styles/global.css";

initThemes();
initEditorSettings();
initLayout();
initTerminalSettings();
useSnippetStore
  .getState()
  .load()
  .catch(() => {});

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
