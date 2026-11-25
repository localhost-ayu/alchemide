import { useEditorStore } from "../../lib/editorStore";

export function requestCloseTab(path: string): void {
  const { tabs, closeTab } = useEditorStore.getState();
  const tab = tabs.find((candidate) => candidate.path === path);
  if (!tab) {
    return;
  }
  if (tab.dirty && !window.confirm(`${tab.name} has unsaved changes. Close it anyway?`)) {
    return;
  }
  closeTab(path);
}
