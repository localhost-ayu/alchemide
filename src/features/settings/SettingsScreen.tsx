import { type ReactNode, useEffect, useRef, useState } from "react";
import { registerCommands } from "../../lib/commands";
import { useDismiss } from "../../lib/dismiss";
import { nextZoom, TAB_SIZES, useEditorSettings } from "../../lib/editorSettings";
import { LANGUAGE_PREFERENCES, useT } from "../../lib/i18n";
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
  const t = useT();
  const language = useGeneralSettings((state) => state.language);
  const reopenLastFolder = useGeneralSettings((state) => state.reopenLastFolder);
  const closeOnOutsideClick = useGeneralSettings((state) => state.closePanelsOnOutsideClick);
  const updateGeneral = useGeneralSettings((state) => state.update);
  const tabSize = useEditorSettings((state) => state.tabSize);
  const inlineBlame = useEditorSettings((state) => state.inlineBlame);
  const update = useEditorSettings((state) => state.update);

  useEffect(
    () =>
      registerCommands([
        {
          id: "settings.open",
          title: t("settings.open"),
          keys: "Ctrl+,",
          run: () => {
            setQuery("");
            setOpen(true);
          },
        },
        {
          id: "view.zoomIn",
          title: t("settings.zoomIn"),
          keys: "Ctrl+=",
          run: () => changeZoom(1),
        },
        {
          id: "view.zoomOut",
          title: t("settings.zoomOut"),
          keys: "Ctrl+-",
          run: () => changeZoom(-1),
        },
        {
          id: "view.zoomReset",
          title: t("settings.zoomReset"),
          keys: "Ctrl+0",
          run: () => useEditorSettings.getState().update({ zoom: 1 }),
        },
      ]),
    [t],
  );

  useDismiss(isOpen, () => setOpen(false), dialogRef);

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
      <div
        ref={dialogRef}
        className="settings panel"
        role="dialog"
        aria-label={t("settings.title")}
      >
        <header className="settings__header">
          <h2>{t("settings.title")}</h2>
          <input
            className="settings__search"
            type="search"
            aria-label={t("settings.search")}
            placeholder={t("settings.search")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            // biome-ignore lint/a11y/noAutofocus: the settings open from a shortcut and searching is the first thing to do
            autoFocus
          />
          <button type="button" aria-label={t("settings.close")} onClick={() => setOpen(false)}>
            ×
          </button>
        </header>
        {matches === 0 && <p className="settings__empty">{t("settings.noMatch", { query })}</p>}
        <section className="settings__section">
          <h3>{t("settings.general")}</h3>
          <label className="settings__field">
            <span>{t("settings.language")}</span>
            <select
              value={language}
              onChange={(event) =>
                updateGeneral({
                  language:
                    LANGUAGE_PREFERENCES.find((option) => option === event.target.value) ??
                    "system",
                })
              }
            >
              {LANGUAGE_PREFERENCES.map((option) => (
                <option key={option} value={option}>
                  {t(`language.${option}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="settings__field">
            <span>{t("settings.reopenLastFolder")}</span>
            <input
              type="checkbox"
              checked={reopenLastFolder}
              onChange={(event) => updateGeneral({ reopenLastFolder: event.target.checked })}
            />
          </label>
          <label className="settings__field">
            <span>{t("settings.closeOnOutsideClick")}</span>
            <input
              type="checkbox"
              checked={closeOnOutsideClick}
              onChange={(event) =>
                updateGeneral({ closePanelsOnOutsideClick: event.target.checked })
              }
            />
          </label>
        </section>
        <TextSettings />
        <section className="settings__section">
          <h3>{t("settings.editor")}</h3>
          <label className="settings__field">
            <span>{t("settings.tabSize")}</span>
            <select
              value={tabSize}
              onChange={(event) => update({ tabSize: Number(event.target.value) })}
            >
              {TAB_SIZES.map((size) => (
                <option key={size} value={size}>
                  {t("settings.tabSizeOption", { size })}
                </option>
              ))}
            </select>
          </label>
          <label className="settings__field">
            <span>{t("settings.inlineBlame")}</span>
            <input
              type="checkbox"
              checked={inlineBlame}
              onChange={(event) => update({ inlineBlame: event.target.checked })}
            />
          </label>
        </section>
        {children}
        <ShortcutSettings />
      </div>
    </div>
  );
}
