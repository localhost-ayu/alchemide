import { type MessageKey, useT } from "../../lib/i18n";
import { MAX_RADIUS } from "./parseTheme";
import { RangeField } from "./RangeField";
import type { ThemeShape, UiFont } from "./theme";

type Props = {
  shape: ThemeShape;
  onChange: (shape: ThemeShape) => void;
};

const CORNER_PRESETS: [MessageKey, number][] = [
  ["themes.cornersSquare", 0],
  ["themes.cornersSoft", 4],
  ["themes.cornersDefault", 8],
  ["themes.cornersRound", 14],
];

const FONTS: [UiFont, MessageKey, string][] = [
  ["system", "themes.fontSystem", "system-ui, sans-serif"],
  [
    "rounded",
    "themes.fontRounded",
    'ui-rounded, "SF Pro Rounded", "Segoe UI Variable Display", "Nunito", system-ui',
  ],
  ["serif", "themes.fontEditorial", 'ui-serif, "Iowan Old Style", Georgia, serif'],
  ["mono", "themes.fontTerminal", "var(--font-code)"],
];

export function ShapeFields({ shape, onChange }: Props) {
  const t = useT();
  return (
    <>
      <h3>{t("themes.shape")}</h3>
      <RangeField
        label={t("themes.corners")}
        value={shape.radius}
        min={0}
        max={MAX_RADIUS}
        step={1}
        format={(value) => `${value}px`}
        onChange={(radius) => onChange({ ...shape, radius })}
      />
      <div className="theme-editor__chips">
        {CORNER_PRESETS.map(([label, radius]) => (
          <button
            key={label}
            type="button"
            className="theme-editor__chip"
            aria-pressed={shape.radius === radius}
            style={{ borderRadius: radius }}
            onClick={() => onChange({ ...shape, radius })}
          >
            {t(label)}
          </button>
        ))}
      </div>
      <fieldset className="theme-editor__group">
        <legend>{t("themes.interfaceFont")}</legend>
        <div className="theme-editor__fonts">
          {FONTS.map(([font, label, stack]) => (
            <label key={font} className="theme-editor__font">
              <input
                type="radio"
                name="interface-font"
                value={font}
                checked={shape.font === font}
                onChange={() => onChange({ ...shape, font })}
              />
              <span style={{ fontFamily: stack }}>{t(label)}</span>
              <small style={{ fontFamily: stack }}>Explorer · main.rs</small>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
