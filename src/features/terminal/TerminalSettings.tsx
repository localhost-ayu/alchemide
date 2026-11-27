import { BUNDLED_FONTS } from "../../lib/fonts";
import { type MessageKey, useT } from "../../lib/i18n";
import { PALETTE_NAMES } from "./terminalPalettes";
import {
  CURSOR_STYLES,
  type CursorStyle,
  FOLLOW_THEME,
  TERMINAL_LIMITS,
  useTerminalSettings,
} from "./useTerminalSettings";

const CURSOR_LABELS: Record<CursorStyle, MessageKey> = {
  block: "terminal.cursorBlock",
  bar: "terminal.cursorBar",
  underline: "terminal.cursorUnderline",
};

export function TerminalSettings() {
  const t = useT();
  const settings = useTerminalSettings();
  const { update } = settings;

  return (
    <section className="settings__section" aria-label={t("terminal.title")}>
      <h3>{t("terminal.title")}</h3>
      <label className="settings__field">
        <span>{t("terminal.colors")}</span>
        <select
          value={settings.palette}
          onChange={(event) => update({ palette: event.target.value })}
        >
          <option value={FOLLOW_THEME}>{t("terminal.followTheme")}</option>
          {PALETTE_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="settings__field">
        <span>{t("terminal.font")}</span>
        <select
          value={settings.fontFamily}
          onChange={(event) => update({ fontFamily: event.target.value })}
        >
          <option value="">{t("terminal.sameAsEditor")}</option>
          {BUNDLED_FONTS.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      </label>
      <label className="settings__field">
        <span>{t("terminal.lineHeight")}</span>
        <input
          type="number"
          min={TERMINAL_LIMITS.lineHeight.min}
          max={TERMINAL_LIMITS.lineHeight.max}
          step={TERMINAL_LIMITS.lineHeight.step}
          value={settings.lineHeight}
          onChange={(event) => update({ lineHeight: Number(event.target.value) })}
        />
      </label>
      <label className="settings__field">
        <span>{t("terminal.cursor")}</span>
        <select
          value={settings.cursorStyle}
          onChange={(event) => update({ cursorStyle: event.target.value as CursorStyle })}
        >
          {CURSOR_STYLES.map((style) => (
            <option key={style} value={style}>
              {t(CURSOR_LABELS[style])}
            </option>
          ))}
        </select>
      </label>
      <label className="settings__field">
        <span>{t("terminal.cursorBlink")}</span>
        <input
          type="checkbox"
          checked={settings.cursorBlink}
          onChange={(event) => update({ cursorBlink: event.target.checked })}
        />
      </label>
      <label className="settings__field">
        <span>{t("terminal.padding")}</span>
        <input
          type="number"
          min={TERMINAL_LIMITS.padding.min}
          max={TERMINAL_LIMITS.padding.max}
          step={TERMINAL_LIMITS.padding.step}
          value={settings.padding}
          onChange={(event) => update({ padding: Number(event.target.value) })}
        />
      </label>
      <label className="settings__field">
        <span>{t("terminal.scrollback")}</span>
        <input
          type="number"
          min={TERMINAL_LIMITS.scrollback.min}
          max={TERMINAL_LIMITS.scrollback.max}
          step={TERMINAL_LIMITS.scrollback.step}
          value={settings.scrollback}
          onChange={(event) => update({ scrollback: Number(event.target.value) })}
        />
      </label>
      <label className="settings__field">
        <span>{t("terminal.bell")}</span>
        <input
          type="checkbox"
          checked={settings.visualBell}
          onChange={(event) => update({ visualBell: event.target.checked })}
        />
      </label>
    </section>
  );
}
