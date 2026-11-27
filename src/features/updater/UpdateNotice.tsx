import { useEffect } from "react";
import { registerCommands } from "../../lib/commands";
import { useT } from "../../lib/i18n";
import { initUpdater, useUpdaterStore } from "./useUpdaterStore";
import "./Updater.css";

export function UpdateNotice() {
  const t = useT();
  const available = useUpdaterStore((state) => state.available);
  const installing = useUpdaterStore((state) => state.installing);
  const error = useUpdaterStore((state) => state.error);
  const { install, dismiss } = useUpdaterStore.getState();

  useEffect(() => {
    initUpdater();
  }, []);

  useEffect(
    () =>
      registerCommands([
        {
          id: "updates.check",
          title: t("updates.check"),
          run: () => useUpdaterStore.getState().check(true),
        },
      ]),
    [t],
  );

  if (!available) {
    return null;
  }
  return (
    <div className="update-notice panel" role="dialog" aria-label={t("updates.dialog")}>
      <p>
        {t("updates.availablePrefix")} <strong>{available.version}</strong>{" "}
        {t("updates.availableSuffix")}
      </p>
      {available.notes && <p className="update-notice__notes">{available.notes}</p>}
      {error && (
        <p role="alert" className="update-notice__error">
          {error}
        </p>
      )}
      <div className="update-notice__actions">
        <button type="button" disabled={installing} onClick={() => install()}>
          {installing ? t("updates.installing") : t("updates.install")}
        </button>
        <button type="button" disabled={installing} onClick={dismiss}>
          {t("updates.later")}
        </button>
      </div>
    </div>
  );
}
