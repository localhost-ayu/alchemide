import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { initThemes } from "./features/themes/useThemeStore";
import { initEditorSettings } from "./lib/editorSettings";
import { initLayout } from "./lib/layoutStore";
import "./styles/global.css";

initThemes();
initEditorSettings();
initLayout();

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
