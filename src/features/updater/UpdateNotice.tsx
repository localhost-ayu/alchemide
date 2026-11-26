import { useEffect } from "react";
import { registerCommands } from "../../lib/commands";
import { initUpdater, useUpdaterStore } from "./useUpdaterStore";
import "./Updater.css";

export function UpdateNotice() {
  const available = useUpdaterStore((state) => state.available);
  const installing = useUpdaterStore((state) => state.installing);
  const error = useUpdaterStore((state) => state.error);
  const { install, dismiss } = useUpdaterStore.getState();

  useEffect(() => {
    initUpdater();
    return registerCommands([
      {
        id: "updates.check",
        title: "Check for updates",
        run: () => useUpdaterStore.getState().check(true),
      },
    ]);
  }, []);

  if (!available) {
    return null;
  }
  return (
    <div className="update-notice panel" role="dialog" aria-label="Update available">
      <p>
        Alchemide <strong>{available.version}</strong> is available.
      </p>
      {available.notes && <p className="update-notice__notes">{available.notes}</p>}
      {error && (
        <p role="alert" className="update-notice__error">
          {error}
        </p>
      )}
      <div className="update-notice__actions">
        <button type="button" disabled={installing} onClick={() => install()}>
          {installing ? "Installing…" : "Install and restart"}
        </button>
        <button type="button" disabled={installing} onClick={dismiss}>
          Later
        </button>
      </div>
    </div>
  );
}
