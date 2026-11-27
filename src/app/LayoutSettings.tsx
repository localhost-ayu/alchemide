import { type Layout, type MenuBarMode, useLayoutStore } from "../lib/layoutStore";

const MENU_BAR_LABELS: [MenuBarMode, string][] = [
  ["auto", "Shows with Alt or at the top edge"],
  ["always", "Always visible"],
  ["never", "Hidden (menus stay in the settings button)"],
];

const OPTIONS: { key: keyof Pick<Layout, "activityBar" | "statusBar" | "tabs">; label: string }[] =
  [
    { key: "activityBar", label: "Activity bar" },
    { key: "statusBar", label: "Status bar" },
    { key: "tabs", label: "Editor tabs" },
  ];

export function LayoutSettings() {
  const layout = useLayoutStore();

  return (
    <section className="settings__section">
      <h3>Layout</h3>
      {OPTIONS.map(({ key, label }) => (
        <label key={key} className="settings__field">
          <span>{label}</span>
          <input
            type="checkbox"
            checked={layout[key]}
            onChange={(event) => layout.update({ [key]: event.target.checked })}
          />
        </label>
      ))}
      <label className="settings__field">
        <span>Menu bar</span>
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
              {label}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
