import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { useWorkspaceStore } from "./features/explorer/useWorkspaceStore";
import { initGeneralSettings } from "./features/settings/useGeneralSettings";
import { initTerminalSettings } from "./features/terminal/useTerminalSettings";
import { initMascotLock } from "./features/themes/mascotLock";
import { initThemes } from "./features/themes/useThemeStore";
import { initEditorSettings } from "./lib/editorSettings";
import { setLanguagePreference } from "./lib/i18n";
import { initKeybindings } from "./lib/keybindings";
import { initLayout } from "./lib/layoutStore";
import { useSnippetStore } from "./lib/snippetStore";
import "./styles/global.css";

setLanguagePreference("system");
initThemes();
initMascotLock();
initKeybindings();
initGeneralSettings().then(({ reopenLastFolder }) => {
  if (reopenLastFolder) {
    void useWorkspaceStore.getState().restoreLastFolder();
  }
});
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
