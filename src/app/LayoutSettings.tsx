import { type Layout, useLayoutStore } from "../lib/layoutStore";

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
    </section>
  );
}
