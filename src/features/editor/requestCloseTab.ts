import { useEditorStore } from "../../lib/editorStore";
import { t } from "../../lib/i18n";

export function requestCloseTab(path: string): void {
  const { tabs, closeTab } = useEditorStore.getState();
  const tab = tabs.find((candidate) => candidate.path === path);
  if (!tab) {
    return;
  }
  if (tab.dirty && !window.confirm(t("editor.confirmCloseTab", { name: tab.name }))) {
    return;
  }
  closeTab(path);
}
