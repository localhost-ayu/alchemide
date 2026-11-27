import { type MessageKey, useT } from "../../lib/i18n";
import { minimumPanelOpacity } from "./colors";
import {
  changeBackground,
  changeMascot,
  type Look,
  shownBackground,
  shownMascot,
} from "./customLook";
import { setMascotLocked, useMascotLock } from "./mascotLock";
import { RangeField } from "./RangeField";
import {
  type Corner,
  DEFAULT_EDITOR_BACKDROP,
  type EditorBackdrop,
  type EditorBackdropMode,
  type Fit,
} from "./theme";

type LookFieldsProps = {
  look: Look;
  onChange: (look: Look) => void;
};

const CORNERS: [Corner, MessageKey][] = [
  ["top-left", "themes.cornerTopLeft"],
  ["top-right", "themes.cornerTopRight"],
  ["bottom-left", "themes.cornerBottomLeft"],
  ["bottom-right", "themes.cornerBottomRight"],
];

const EDITOR_MODES: [EditorBackdropMode, MessageKey][] = [
  ["layer", "themes.backdropLayer"],
  ["sharp", "themes.backdropSharp"],
  ["solid", "themes.backdropSolid"],
];

const toEditorMode = (value: string): EditorBackdropMode =>
  EDITOR_MODES.find(([mode]) => mode === value)?.[0] ?? DEFAULT_EDITOR_BACKDROP.mode;

const toFit = (value: string): Fit => (value === "contain" ? "contain" : "cover");
const toCorner = (value: string): Corner =>
  CORNERS.find(([corner]) => corner === value)?.[0] ?? "bottom-right";

const percent = (value: number) => `${Math.round(value * 100)}%`;
const pixels = (value: number) => `${value}px`;

export function LookFields({ look, onChange }: LookFieldsProps) {
  const t = useT();
  const { glass } = look.theme;
  const background = shownBackground(look);
  const mascot = shownMascot(look);
  const locked = useMascotLock((state) => state.locked);
  const surface = look.theme.effects.surface;
  const setSurface = (glassy: boolean) =>
    onChange({
      ...look,
      theme: {
        ...look.theme,
        effects: { ...look.theme.effects, surface: glassy ? "glass" : "solid" },
      },
    });
  const editorBackdrop = background?.editor ?? DEFAULT_EDITOR_BACKDROP;
  const setEditorBackdrop = (changes: Partial<EditorBackdrop>) =>
    onChange(changeBackground(look, { editor: { ...editorBackdrop, ...changes } }));
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
      <h3>{t("themes.glass")}</h3>
      <label className="settings__field theme-editor__switch">
        <span>{t("themes.glassPanels")}</span>
        <input
          type="checkbox"
          checked={surface === "glass"}
          onChange={(event) => setSurface(event.target.checked)}
        />
      </label>
      <RangeField
        label={t("themes.panelOpacity")}
        value={glass.panelOpacity}
        min={0.2}
        max={1}
        step={0.01}
        format={percent}
        onChange={(panelOpacity) => setGlass({ panelOpacity })}
      />
      <RangeField
        label={t("themes.glassBlur")}
        value={glass.blur}
        min={0}
        max={40}
        step={1}
        format={pixels}
        onChange={(blur) => setGlass({ blur })}
      />
      {suggested && (
        <div className="theme-editor__suggestion" role="status">
          <span>{t("themes.readabilityWarning", { value: percent(suggested) })}</span>
          <button
            type="button"
            className="theme-editor__apply"
            onClick={() => setGlass({ panelOpacity: suggested })}
          >
            {t("themes.useValue", { value: percent(suggested) })}
          </button>
        </div>
      )}
      <h3>{t("themes.background")}</h3>
      {background ? (
        <>
          <RangeField
            label={t("themes.backgroundDim")}
            value={background.dim}
            min={0}
            max={1}
            step={0.01}
            format={percent}
            onChange={(dim) => onChange(changeBackground(look, { dim }))}
          />
          <RangeField
            label={t("themes.backgroundBlur")}
            value={background.blur}
            min={0}
            max={40}
            step={1}
            format={pixels}
            onChange={(blur) => onChange(changeBackground(look, { blur }))}
          />
          <label className="theme-editor__select">
            <span>{t("themes.fit")}</span>
            <select
              value={background.fit}
              onChange={(event) =>
                onChange(changeBackground(look, { fit: toFit(event.target.value) }))
              }
            >
              <option value="cover">{t("themes.fitCover")}</option>
              <option value="contain">{t("themes.fitContain")}</option>
            </select>
          </label>
          <label className="theme-editor__select">
            <span>{t("themes.behindOpenFiles")}</span>
            <select
              value={editorBackdrop.mode}
              onChange={(event) => setEditorBackdrop({ mode: toEditorMode(event.target.value) })}
            >
              {EDITOR_MODES.map(([mode, label]) => (
                <option key={mode} value={mode}>
                  {t(label)}
                </option>
              ))}
            </select>
          </label>
          {editorBackdrop.mode === "layer" && (
            <>
              <RangeField
                label={t("themes.layerDim")}
                value={editorBackdrop.dim}
                min={0}
                max={1}
                step={0.01}
                format={percent}
                onChange={(dim) => setEditorBackdrop({ dim })}
              />
              <RangeField
                label={t("themes.layerBlur")}
                value={editorBackdrop.blur}
                min={0}
                max={40}
                step={1}
                format={pixels}
                onChange={(blur) => setEditorBackdrop({ blur })}
              />
            </>
          )}
        </>
      ) : (
        <p className="theme-editor__hint">{t("themes.chooseBackgroundHint")}</p>
      )}
      <h3>{t("themes.mascot")}</h3>
      {mascot ? (
        <>
          <RangeField
            label={t("themes.mascotOpacity")}
            value={mascot.opacity}
            min={0}
            max={1}
            step={0.01}
            format={percent}
            onChange={(opacity) => onChange(changeMascot(look, { opacity }))}
          />
          <RangeField
            label={t("themes.mascotSize")}
            value={mascot.size}
            min={32}
            max={1024}
            step={8}
            format={pixels}
            onChange={(size) => onChange(changeMascot(look, { size }))}
          />
          <label className="theme-editor__select">
            <span>{t("themes.corner")}</span>
            <select
              value={mascot.corner}
              onChange={(event) =>
                onChange(
                  changeMascot(look, { corner: toCorner(event.target.value), position: undefined }),
                )
              }
            >
              {CORNERS.map(([corner, label]) => (
                <option key={corner} value={corner}>
                  {t(label)}
                </option>
              ))}
            </select>
          </label>
          <label className="theme-editor__select">
            <span>{t("themes.layer")}</span>
            <select
              value={mascot.layer ?? "behind"}
              onChange={(event) =>
                onChange(
                  changeMascot(look, {
                    layer: event.target.value === "front" ? "front" : "behind",
                  }),
                )
              }
            >
              <option value="behind">{t("themes.behindCode")}</option>
              <option value="front">{t("themes.inFrontOfCode")}</option>
            </select>
          </label>
          <label className="settings__field theme-editor__switch">
            <span>{t("themes.mascotLocked")}</span>
            <input
              type="checkbox"
              checked={locked}
              onChange={(event) => setMascotLocked(event.target.checked)}
            />
          </label>
          {mascot.position && (
            <button
              type="button"
              className="theme-editor__secondary"
              onClick={() => onChange(changeMascot(look, { position: undefined }))}
            >
              {t("themes.backToCorner")}
            </button>
          )}
        </>
      ) : (
        <p className="theme-editor__hint">{t("themes.chooseMascotHint")}</p>
      )}
    </>
  );
}
