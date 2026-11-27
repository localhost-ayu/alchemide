import { runCommand } from "../../lib/commands";
import { type MessageKey, useT } from "../../lib/i18n";
import { BUILTIN_THEMES } from "./builtinThemes";
import type { Effects } from "./theme";
import {
  deleteCurrentTheme,
  duplicateCurrentTheme,
  exportCurrentTheme,
  importThemeFile,
} from "./themeLibrary";
import { findTheme, useThemeStore } from "./useThemeStore";

const FLAGS: { key: "background" | "mascot" | "animations"; label: MessageKey }[] = [
  { key: "background", label: "themes.effectBackground" },
  { key: "mascot", label: "themes.effectMascot" },
  { key: "animations", label: "themes.effectAnimations" },
];

export function ThemeSettings() {
  const t = useT();
  const theme = useThemeStore((state) => state.theme);
  const effects = useThemeStore((state) => state.effects);
  const commit = useThemeStore((state) => state.commit);
  const userThemes = useThemeStore((state) => state.userThemes);
  const isUserTheme = userThemes.some((userTheme) => userTheme.theme.name === theme.name);
  const setEffect = (changes: Partial<Effects>) => commit(theme, { ...effects, ...changes });

  return (
    <section className="settings__section">
      <h3>{t("themes.look")}</h3>
      <label className="settings__field">
        <span>{t("themes.theme")}</span>
        <select
          value={theme.name}
          onChange={(event) => {
            const chosen = findTheme(event.target.value);
            if (chosen) {
              commit(chosen, effects);
            }
          }}
        >
          <optgroup label={t("themes.builtIn")}>
            {BUILTIN_THEMES.map((option) => (
              <option key={option.name} value={option.name}>
                {option.name}
              </option>
            ))}
          </optgroup>
          {userThemes.length > 0 && (
            <optgroup label={t("themes.yourThemes")}>
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
        <button type="button" onClick={() => runCommand("themes.edit")}>
          {t("themes.edit")}
        </button>
        <button type="button" onClick={duplicateCurrentTheme}>
          {t("themes.duplicate")}
        </button>
        <button type="button" onClick={importThemeFile}>
          {t("themes.import")}
        </button>
        <button type="button" onClick={() => runCommand("themes.importVscode")}>
          {t("themes.fromVscode")}
        </button>
        <button type="button" onClick={exportCurrentTheme}>
          {t("themes.export")}
        </button>
        <button type="button" onClick={deleteCurrentTheme} disabled={!isUserTheme}>
          {t("themes.delete")}
        </button>
      </div>
      <p className="settings__hint">{t("themes.editorHint")}</p>
      {FLAGS.map((flag) => (
        <label key={flag.key} className="settings__field">
          <span>{t(flag.label)}</span>
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
