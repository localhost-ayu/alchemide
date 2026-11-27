import { BUILTIN_THEMES } from "./builtinThemes";
import type { Effects } from "./theme";
import {
  deleteCurrentTheme,
  duplicateCurrentTheme,
  exportCurrentTheme,
  importThemeFile,
} from "./themeLibrary";
import { findTheme, useThemeStore } from "./useThemeStore";

const FLAGS: { key: "background" | "mascot" | "animations"; label: string }[] = [
  { key: "background", label: "Background" },
  { key: "mascot", label: "Mascot" },
  { key: "animations", label: "Animations" },
];

export function ThemeSettings() {
  const theme = useThemeStore((state) => state.theme);
  const effects = useThemeStore((state) => state.effects);
  const commit = useThemeStore((state) => state.commit);
  const userThemes = useThemeStore((state) => state.userThemes);
  const isUserTheme = userThemes.some((userTheme) => userTheme.theme.name === theme.name);
  const setEffect = (changes: Partial<Effects>) => commit(theme, { ...effects, ...changes });

  return (
    <section className="settings__section">
      <h3>Look</h3>
      <label className="settings__field">
        <span>Theme</span>
        <select
          value={theme.name}
          onChange={(event) => {
            const chosen = findTheme(event.target.value);
            if (chosen) {
              commit(chosen, effects);
            }
          }}
        >
          <optgroup label="Built-in">
            {BUILTIN_THEMES.map((option) => (
              <option key={option.name} value={option.name}>
                {option.name}
              </option>
            ))}
          </optgroup>
          {userThemes.length > 0 && (
            <optgroup label="Your themes">
              {userThemes.map(({ file, theme: option }) => (
                <option key={file} value={option.name}>
                  {option.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </label>
      <div className="settings__actions">
        <button type="button" onClick={duplicateCurrentTheme}>
          Duplicate
        </button>
        <button type="button" onClick={importThemeFile}>
          Import…
        </button>
        <button type="button" onClick={exportCurrentTheme}>
          Export…
        </button>
        <button type="button" onClick={deleteCurrentTheme} disabled={!isUserTheme}>
          Delete
        </button>
      </div>
      <label className="settings__field">
        <span>Glass panels</span>
        <input
          type="checkbox"
          checked={effects.surface === "glass"}
          onChange={(event) => setEffect({ surface: event.target.checked ? "glass" : "solid" })}
        />
      </label>
      {FLAGS.map((flag) => (
        <label key={flag.key} className="settings__field">
          <span>{flag.label}</span>
          <input
            type="checkbox"
            checked={effects[flag.key]}
            onChange={(event) => setEffect({ [flag.key]: event.target.checked })}
          />
        </label>
      ))}
    </section>
  );
}
