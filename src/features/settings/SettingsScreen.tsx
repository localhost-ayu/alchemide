import { type ReactNode, useEffect, useState } from "react";
import { registerCommands } from "../../lib/commands";
import { TAB_SIZES, useEditorSettings } from "../../lib/editorSettings";
import "./Settings.css";

type SettingsScreenProps = {
  children?: ReactNode;
};

export function SettingsScreen({ children }: SettingsScreenProps) {
  const [isOpen, setOpen] = useState(false);
  const fontFamily = useEditorSettings((state) => state.fontFamily);
  const fontSize = useEditorSettings((state) => state.fontSize);
  const tabSize = useEditorSettings((state) => state.tabSize);
  const update = useEditorSettings((state) => state.update);
  const [fontDraft, setFontDraft] = useState(fontFamily);

  useEffect(
    () =>
      registerCommands([
        {
          id: "settings.open",
          title: "Open settings",
          keys: "Ctrl+,",
          run: () => {
            setFontDraft(useEditorSettings.getState().fontFamily);
            setOpen(true);
          },
        },
      ]),
    [],
  );

  if (!isOpen) {
    return null;
  }
  return (
    <div className="settings__overlay">
      <div
        className="settings panel"
        role="dialog"
        aria-label="Settings"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
      >
        <header className="settings__header">
          <h2>Settings</h2>
          <button type="button" aria-label="Close settings" onClick={() => setOpen(false)}>
            ×
          </button>
        </header>
        <section className="settings__section">
          <h3>Editor</h3>
          <label className="settings__field">
            <span>Font</span>
            <input
              value={fontDraft}
              placeholder="Maple Mono"
              onChange={(event) => setFontDraft(event.target.value)}
              onBlur={() => update({ fontFamily: fontDraft })}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  update({ fontFamily: fontDraft });
                }
              }}
            />
          </label>
          <label className="settings__field">
            <span>Font size</span>
            <input
              type="number"
              min={10}
              max={28}
              value={fontSize}
              onChange={(event) => update({ fontSize: Number(event.target.value) })}
            />
          </label>
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
      </div>
    </div>
  );
}
