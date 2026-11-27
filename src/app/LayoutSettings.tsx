import { type MessageKey, useT } from "../lib/i18n";
import { type Layout, type MenuBarMode, useLayoutStore } from "../lib/layoutStore";

const MENU_BAR_LABELS: [MenuBarMode, MessageKey][] = [
  ["auto", "settings.menuBarAuto"],
  ["always", "settings.menuBarAlways"],
  ["never", "settings.menuBarNever"],
];

const OPTIONS: {
  key: keyof Pick<Layout, "activityBar" | "statusBar" | "tabs">;
  label: MessageKey;
}[] = [
  { key: "activityBar", label: "settings.activityBar" },
  { key: "statusBar", label: "settings.statusBar" },
  { key: "tabs", label: "settings.editorTabs" },
];

export function LayoutSettings() {
  const t = useT();
  const layout = useLayoutStore();

  return (
    <section className="settings__section">
      <h3>{t("settings.layout")}</h3>
      {OPTIONS.map(({ key, label }) => (
        <label key={key} className="settings__field">
          <span>{t(label)}</span>
          <input
            type="checkbox"
            checked={layout[key]}
            onChange={(event) => layout.update({ [key]: event.target.checked })}
          />
        </label>
      ))}
      <label className="settings__field">
        <span>{t("settings.menuBar")}</span>
        <select
          value={layout.menuBar}
          onChange={(event) =>
            layout.update({
              menuBar: MENU_BAR_LABELS.find(([mode]) => mode === event.target.value)?.[0] ?? "auto",
            })
          }
        >
          {MENU_BAR_LABELS.map(([mode, label]) => (
            <option key={mode} value={mode}>
              {t(label)}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
