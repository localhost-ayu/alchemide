import { type ReactNode, useEffect, useRef, useState } from "react";
import { registerCommands } from "../../lib/commands";
import { useDismiss } from "../../lib/dismiss";
import { nextZoom, TAB_SIZES, useEditorSettings } from "../../lib/editorSettings";
import { ShortcutSettings } from "./ShortcutSettings";
import { filterSettings } from "./settingsSearch";
import { TextSettings } from "./TextSettings";
import { useGeneralSettings } from "./useGeneralSettings";
import "./Settings.css";

type SettingsScreenProps = {
  children?: ReactNode;
};

function changeZoom(direction: 1 | -1): void {
  const { zoom, update } = useEditorSettings.getState();
  void update({ zoom: nextZoom(zoom, direction) });
}

export function SettingsScreen({ children }: SettingsScreenProps) {
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState(1);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reopenLastFolder = useGeneralSettings((state) => state.reopenLastFolder);
  const updateGeneral = useGeneralSettings((state) => state.update);
  const tabSize = useEditorSettings((state) => state.tabSize);
  const update = useEditorSettings((state) => state.update);

  useEffect(
    () =>
      registerCommands([
        {
          id: "settings.open",
          title: "Open settings",
          keys: "Ctrl+,",
          run: () => {
            setQuery("");
            setOpen(true);
          },
        },
        {
          id: "view.zoomIn",
          title: "Zoom in",
          keys: "Ctrl+=",
          run: () => changeZoom(1),
        },
        {
          id: "view.zoomOut",
          title: "Zoom out",
          keys: "Ctrl+-",
          run: () => changeZoom(-1),
        },
        {
          id: "view.zoomReset",
          title: "Reset zoom",
          keys: "Ctrl+0",
          run: () => useEditorSettings.getState().update({ zoom: 1 }),
        },
      ]),
    [],
  );

  useDismiss(isOpen, () => setOpen(false));

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      setMatches(filterSettings(dialogRef.current, query));
    }
  });

  if (!isOpen) {
    return null;
  }
  return (
    <div className="settings__overlay">
      <div ref={dialogRef} className="settings panel" role="dialog" aria-label="Settings">
        <header className="settings__header">
          <h2>Settings</h2>
          <input
            className="settings__search"
            type="search"
            aria-label="Search settings"
            placeholder="Search settings"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            // biome-ignore lint/a11y/noAutofocus: the settings open from a shortcut and searching is the first thing to do
            autoFocus
          />
          <button type="button" aria-label="Close settings" onClick={() => setOpen(false)}>
            ×
          </button>
        </header>
        {matches === 0 && <p className="settings__empty">No setting matches “{query}”</p>}
        <section className="settings__section">
          <h3>General</h3>
          <label className="settings__field">
            <span>Reopen the last folder on start</span>
            <input
              type="checkbox"
              checked={reopenLastFolder}
              onChange={(event) => updateGeneral({ reopenLastFolder: event.target.checked })}
            />
          </label>
        </section>
        <TextSettings />
        <section className="settings__section">
          <h3>Editor</h3>
          <label className="settings__field">
            <span>Tab size</span>
            <select
              value={tabSize}
              onChange={(event) => update({ tabSize: Number(event.target.value) })}
            >
              {TAB_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} spaces
                </option>
              ))}
            </select>
          </label>
        </section>
        {children}
        <ShortcutSettings />
      </div>
    </div>
  );
}
