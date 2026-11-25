import { useEditorStore } from "../../lib/editorStore";
import { requestCloseTab } from "./requestCloseTab";

export function Tabs() {
  const tabs = useEditorStore((state) => state.tabs);
  const activePath = useEditorStore((state) => state.activePath);
  const activate = useEditorStore((state) => state.activate);

  if (tabs.length === 0) {
    return null;
  }
  return (
    <div className="tabs" role="tablist" aria-label="Open files">
      {tabs.map((tab) => (
        <div key={tab.path} className="tabs__tab" data-active={tab.path === activePath}>
          <button
            type="button"
            role="tab"
            aria-selected={tab.path === activePath}
            className="tabs__label"
            title={tab.path}
            onClick={() => activate(tab.path)}
          >
            {tab.name}
            {tab.dirty && (
              <span className="tabs__dirty" role="img" aria-label="unsaved">
                ●
              </span>
            )}
          </button>
          <button
            type="button"
            className="tabs__close"
            aria-label={`Close ${tab.name}`}
            onClick={() => requestCloseTab(tab.path)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
