import { MAX_RADIUS } from "./parseTheme";
import { RangeField } from "./RangeField";
import type { ThemeShape, UiFont } from "./theme";

type Props = {
  shape: ThemeShape;
  onChange: (shape: ThemeShape) => void;
};

const CORNER_PRESETS: [string, number][] = [
  ["Square", 0],
  ["Soft", 4],
  ["Default", 8],
  ["Round", 14],
];

const FONTS: [UiFont, string, string][] = [
  ["system", "System", "system-ui, sans-serif"],
  [
    "rounded",
    "Rounded",
    'ui-rounded, "SF Pro Rounded", "Segoe UI Variable Display", "Nunito", system-ui',
  ],
  ["serif", "Editorial", 'ui-serif, "Iowan Old Style", Georgia, serif'],
  ["mono", "Terminal", "var(--font-code)"],
];

export function ShapeFields({ shape, onChange }: Props) {
  return (
    <>
      <h3>Shape</h3>
      <RangeField
        label="Corners"
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
            {label}
          </button>
        ))}
      </div>
      <fieldset className="theme-editor__group">
        <legend>Interface font</legend>
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
              <span style={{ fontFamily: stack }}>{label}</span>
              <small style={{ fontFamily: stack }}>Explorer · main.rs</small>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
