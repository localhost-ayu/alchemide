import { type ReactNode, useEffect, useState } from "react";
import { registerCommands } from "../../lib/commands";
import { useDismiss } from "../../lib/dismiss";
import { nextZoom, TAB_SIZES, useEditorSettings } from "../../lib/editorSettings";
import { ShortcutSettings } from "./ShortcutSettings";
import { TextSettings } from "./TextSettings";
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
  const tabSize = useEditorSettings((state) => state.tabSize);
  const update = useEditorSettings((state) => state.update);

  useEffect(
    () =>
      registerCommands([
        {
          id: "settings.open",
          title: "Open settings",
          keys: "Ctrl+,",
          run: () => setOpen(true),
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

  if (!isOpen) {
    return null;
  }
  return (
    <div className="settings__overlay">
      <div className="settings panel" role="dialog" aria-label="Settings">
        <header className="settings__header">
          <h2>Settings</h2>
          <button type="button" aria-label="Close settings" onClick={() => setOpen(false)}>
            ×
          </button>
        </header>
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
