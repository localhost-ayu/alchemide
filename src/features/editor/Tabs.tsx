import { useEditorStore } from "../../lib/editorStore";
import { useT } from "../../lib/i18n";
import { requestCloseTab } from "./requestCloseTab";
import { tabDetails } from "./tabLabels";
import { useChangesStore } from "./useChangesStore";

export function Tabs() {
  const t = useT();
  const tabs = useEditorStore((state) => state.tabs);
  const activePath = useEditorStore((state) => state.activePath);
  const activate = useEditorStore((state) => state.activate);
  const changesOpen = useChangesStore((state) => state.open);
  const { hide } = useChangesStore.getState();

  if (tabs.length === 0 && !changesOpen) {
    return null;
  }
  const details = tabDetails(tabs.map((tab) => tab.path));
  return (
    <div className="tabs" role="tablist" aria-label={t("editor.openFiles")}>
      {tabs.map((tab) => (
        <div
          key={tab.path}
          className="tabs__tab"
          data-active={!changesOpen && tab.path === activePath}
        >
          <button
            type="button"
            role="tab"
            aria-selected={!changesOpen && tab.path === activePath}
            className="tabs__label"
            title={tab.path}
            onClick={() => {
              hide();
              activate(tab.path);
            }}
          >
            {tab.name}
            {details.has(tab.path) && <span className="tabs__detail">{details.get(tab.path)}</span>}
            {tab.dirty && (
              <span className="tabs__dirty" role="img" aria-label={t("editor.unsaved")}>
                ●
              </span>
            )}
          </button>
          <button
            type="button"
            className="tabs__close"
            aria-label={
              details.has(tab.path)
                ? t("editor.closeFileDetail", {
                    name: tab.name,
                    detail: details.get(tab.path) ?? "",
                  })
                : t("editor.closeFile", { name: tab.name })
            }
            onClick={() => requestCloseTab(tab.path)}
          >
            ×
          </button>
        </div>
      ))}
      {changesOpen && (
        <div className="tabs__tab" data-active="true">
          <button type="button" role="tab" aria-selected="true" className="tabs__label">
            <span aria-hidden="true">±</span> {t("changes.title")}
          </button>
          <button
            type="button"
            className="tabs__close"
            aria-label={t("changes.close")}
            onClick={hide}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
