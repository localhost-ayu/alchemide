import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { useWorkspaceStore } from "./features/explorer/useWorkspaceStore";
import { initGeneralSettings } from "./features/settings/useGeneralSettings";
import { initThemes } from "./features/themes/useThemeStore";
import { initEditorSettings } from "./lib/editorSettings";
import { initLayout } from "./lib/layoutStore";
import { useSnippetStore } from "./lib/snippetStore";
import "./styles/global.css";

initThemes();
initGeneralSettings().then(({ reopenLastFolder }) => {
  if (reopenLastFolder) {
    void useWorkspaceStore.getState().restoreLastFolder();
  }
});
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
