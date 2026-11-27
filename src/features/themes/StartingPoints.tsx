import { useT } from "../../lib/i18n";
import { BUILTIN_THEMES } from "./builtinThemes";
import type { Theme } from "./theme";

type Props = { onPick: (start: Theme) => void };

export function StartingPoints({ onPick }: Props) {
  const t = useT();
  return (
    <fieldset className="theme-editor__group">
      <legend>{t("themes.startingPoints")}</legend>
      <div className="theme-editor__chips">
        {BUILTIN_THEMES.map((start) => (
          <button
            key={start.name}
            type="button"
            className="theme-editor__chip"
            title={t("themes.useStartingPoint", { name: start.name })}
            onClick={() => onPick(start)}
          >
            <span
              className="theme-editor__swatch"
              aria-hidden="true"
              style={{
                background: `linear-gradient(135deg, ${start.ui.panel} 50%, ${start.ui.accent} 50%)`,
              }}
            />
            {start.name}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
