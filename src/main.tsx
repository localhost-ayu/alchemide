import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { initThemes } from "./features/themes/useThemeStore";
import { initEditorSettings } from "./lib/editorSettings";
import { initKeybindings } from "./lib/keybindings";
import { initLayout } from "./lib/layoutStore";
import { useSnippetStore } from "./lib/snippetStore";
import "./styles/global.css";

initThemes();
initKeybindings();
initEditorSettings();
initLayout();
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
