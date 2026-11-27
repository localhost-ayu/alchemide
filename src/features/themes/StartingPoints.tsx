import { BUILTIN_THEMES } from "./builtinThemes";
import type { Theme } from "./theme";

type Props = { onPick: (start: Theme) => void };

export function StartingPoints({ onPick }: Props) {
  return (
    <fieldset className="theme-editor__group">
      <legend>Starting points</legend>
      <div className="theme-editor__chips">
        {BUILTIN_THEMES.map((start) => (
          <button
            key={start.name}
            type="button"
            className="theme-editor__chip"
            title={`Use the colors and shape of ${start.name}`}
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
