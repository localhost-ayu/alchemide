import { useT } from "../../lib/i18n";
import { useUpdaterStore } from "./useUpdaterStore";

export function UpdateSettings() {
  const t = useT();
  const checkOnStart = useUpdaterStore((state) => state.checkOnStart);
  const setCheckOnStart = useUpdaterStore((state) => state.setCheckOnStart);

  return (
    <section className="settings__section">
      <h3>{t("settings.updates")}</h3>
      <label className="settings__field">
        <span>{t("settings.checkUpdates")}</span>
        <input
          type="checkbox"
          checked={checkOnStart}
          onChange={(event) => setCheckOnStart(event.target.checked)}
        />
      </label>
    </section>
  );
}
