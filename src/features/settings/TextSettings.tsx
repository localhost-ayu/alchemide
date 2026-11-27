import { useState } from "react";
import { LIMITS, useEditorSettings, ZOOM_LEVELS } from "../../lib/editorSettings";
import { BUNDLED_FONTS, isBundledFont } from "../../lib/fonts";
import { useT } from "../../lib/i18n";

const INSTALLED = "installed";
const SAMPLE = "const flask = 0xBEEF; // => !== <= -> ===";

export function TextSettings() {
  const t = useT();
  const fontFamily = useEditorSettings((state) => state.fontFamily);
  const fontSize = useEditorSettings((state) => state.fontSize);
  const terminalFontSize = useEditorSettings((state) => state.terminalFontSize);
  const lineHeight = useEditorSettings((state) => state.lineHeight);
  const ligatures = useEditorSettings((state) => state.ligatures);
  const zoom = useEditorSettings((state) => state.zoom);
  const update = useEditorSettings((state) => state.update);
  const [usesInstalled, setUsesInstalled] = useState(!isBundledFont(fontFamily));
  const [fontDraft, setFontDraft] = useState(isBundledFont(fontFamily) ? "" : fontFamily);

  const saveInstalledFont = () => {
    if (fontDraft.trim()) {
      update({ fontFamily: fontDraft });
    }
  };

  return (
    <section className="settings__section">
      <h3>{t("settings.text")}</h3>
      <label className="settings__field">
        <span>{t("settings.font")}</span>
        <select
          value={usesInstalled ? INSTALLED : fontFamily}
          onChange={(event) => {
            const choice = event.target.value;
            setUsesInstalled(choice === INSTALLED);
            if (choice !== INSTALLED) {
              update({ fontFamily: choice });
            }
          }}
        >
          {BUNDLED_FONTS.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
          <option value={INSTALLED}>{t("settings.installedFont")}</option>
        </select>
      </label>
      {usesInstalled && (
        <label className="settings__field">
          <span>{t("settings.installedFontName")}</span>
          <input
            value={fontDraft}
            placeholder="Consolas"
            onChange={(event) => setFontDraft(event.target.value)}
            onBlur={saveInstalledFont}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                saveInstalledFont();
              }
            }}
          />
        </label>
      )}
      <p className="settings__sample">{SAMPLE}</p>
      <label className="settings__field settings__field--check">
        <input
          type="checkbox"
          checked={ligatures}
          onChange={(event) => update({ ligatures: event.target.checked })}
        />
        <span>{t("settings.ligatures")}</span>
      </label>
      <label className="settings__field">
        <span>{t("settings.fontSize")}</span>
        <input
          type="number"
          {...LIMITS.fontSize}
          value={fontSize}
          onChange={(event) => update({ fontSize: Number(event.target.value) })}
        />
      </label>
      <label className="settings__field">
        <span>{t("settings.terminalFontSize")}</span>
        <input
          type="number"
          {...LIMITS.terminalFontSize}
          value={terminalFontSize}
          onChange={(event) => update({ terminalFontSize: Number(event.target.value) })}
        />
      </label>
      <label className="settings__field">
        <span>{t("settings.lineHeight")}</span>
        <input
          type="number"
          {...LIMITS.lineHeight}
          value={lineHeight}
          onChange={(event) => update({ lineHeight: Number(event.target.value) })}
        />
      </label>
      <label className="settings__field">
        <span>{t("settings.zoom")}</span>
        <select value={zoom} onChange={(event) => update({ zoom: Number(event.target.value) })}>
          {ZOOM_LEVELS.map((level) => (
            <option key={level} value={level}>
              {Math.round(level * 100)}%
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
