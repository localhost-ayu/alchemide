import { minimumPanelOpacity } from "./colors";
import {
  changeBackground,
  changeMascot,
  type Look,
  shownBackground,
  shownMascot,
} from "./customLook";
import { RangeField } from "./RangeField";
import type { Corner, Fit } from "./theme";

type LookFieldsProps = {
  look: Look;
  onChange: (look: Look) => void;
};

const CORNERS: [Corner, string][] = [
  ["top-left", "Top left"],
  ["top-right", "Top right"],
  ["bottom-left", "Bottom left"],
  ["bottom-right", "Bottom right"],
];

const toFit = (value: string): Fit => (value === "contain" ? "contain" : "cover");
const toCorner = (value: string): Corner =>
  CORNERS.find(([corner]) => corner === value)?.[0] ?? "bottom-right";

const percent = (value: number) => `${Math.round(value * 100)}%`;
const pixels = (value: number) => `${value}px`;

export function LookFields({ look, onChange }: LookFieldsProps) {
  const { glass } = look.theme;
  const background = shownBackground(look);
  const mascot = shownMascot(look);
  const setGlass = (changes: Partial<typeof glass>) =>
    onChange({ ...look, theme: { ...look.theme, glass: { ...glass, ...changes } } });
  const suggested =
    background &&
    minimumPanelOpacity(
      look.theme.ui.panel,
      look.theme.ui.text,
      glass.panelOpacity,
      background.dim,
    );

  return (
    <>
      <h3>Glass</h3>
      <RangeField
        label="Panel opacity"
        value={glass.panelOpacity}
        min={0.2}
        max={1}
        step={0.01}
        format={percent}
        onChange={(panelOpacity) => setGlass({ panelOpacity })}
      />
      <RangeField
        label="Glass blur"
        value={glass.blur}
        min={0}
        max={40}
        step={1}
        format={pixels}
        onChange={(blur) => setGlass({ blur })}
      />
      {suggested && (
        <div className="theme-editor__suggestion" role="status">
          <span>
            Text on the panels may be hard to read over light parts of the background. Use at least{" "}
            {percent(suggested)}.
          </span>
          <button
            type="button"
            className="theme-editor__apply"
            onClick={() => setGlass({ panelOpacity: suggested })}
          >
            Use {percent(suggested)}
          </button>
        </div>
      )}
      <h3>Background</h3>
      {background ? (
        <>
          <RangeField
            label="Background dim"
            value={background.dim}
            min={0}
            max={1}
            step={0.01}
            format={percent}
            onChange={(dim) => onChange(changeBackground(look, { dim }))}
          />
          <RangeField
            label="Background blur"
            value={background.blur}
            min={0}
            max={40}
            step={1}
            format={pixels}
            onChange={(blur) => onChange(changeBackground(look, { blur }))}
          />
          <label className="theme-editor__select">
            <span>Fit</span>
            <select
              value={background.fit}
              onChange={(event) =>
                onChange(changeBackground(look, { fit: toFit(event.target.value) }))
              }
            >
              <option value="cover">Fill the window</option>
              <option value="contain">Show it whole</option>
            </select>
          </label>
        </>
      ) : (
        <p className="theme-editor__hint">Choose a background image with Ctrl+K M to adjust it.</p>
      )}
      <h3>Mascot</h3>
      {mascot ? (
        <>
          <RangeField
            label="Mascot opacity"
            value={mascot.opacity}
            min={0}
            max={1}
            step={0.01}
            format={percent}
            onChange={(opacity) => onChange(changeMascot(look, { opacity }))}
          />
          <RangeField
            label="Mascot size"
            value={mascot.size}
            min={32}
            max={1024}
            step={8}
            format={pixels}
            onChange={(size) => onChange(changeMascot(look, { size }))}
          />
          <label className="theme-editor__select">
            <span>Corner</span>
            <select
              value={mascot.corner}
              onChange={(event) =>
                onChange(changeMascot(look, { corner: toCorner(event.target.value) }))
              }
            >
              {CORNERS.map(([corner, label]) => (
                <option key={corner} value={corner}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : (
        <p className="theme-editor__hint">Choose a mascot image with Ctrl+K M to adjust it.</p>
      )}
    </>
  );
}
