import { useEffect, useState } from "react";
import { registerCommands } from "../../lib/commands";
import { useT } from "../../lib/i18n";
import { onTerminalExit, terminalProfiles } from "../../lib/ipc";
import { onTerminalRequest } from "../../lib/terminalRequests";
import type { TerminalProfile } from "../../lib/types";
import { TerminalView } from "./TerminalView";
import { useTerminalStore } from "./useTerminalStore";
import "./Terminal.css";

export function TerminalPanel() {
  const t = useT();
  const isOpen = useTerminalStore((state) => state.isOpen);
  const tabs = useTerminalStore((state) => state.tabs);
  const activeId = useTerminalStore((state) => state.activeId);
  const error = useTerminalStore((state) => state.error);
  const { toggle, openTab, closeTab, activate } = useTerminalStore.getState();
  const [profiles, setProfiles] = useState<TerminalProfile[]>([]);

  useEffect(
    () =>
      registerCommands([
        {
          id: "terminal.toggle",
          title: t("terminal.toggle"),
          keys: "Ctrl+`",
          run: () => useTerminalStore.getState().toggle(),
        },
        {
          id: "terminal.new",
          title: t("terminal.new"),
          run: () => useTerminalStore.getState().openTab(null, t("terminal.title")),
        },
      ]),
    [t],
  );

  useEffect(() => {
    const exit = onTerminalExit((id) => useTerminalStore.getState().removeTab(id));
    const stopRequests = onTerminalRequest(({ label, command }) =>
      useTerminalStore.getState().openTab(null, label, command),
    );
    return () => {
      stopRequests();
      exit.then((unsubscribe) => unsubscribe());
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      terminalProfiles()
        .then(setProfiles)
        .catch(() => setProfiles([]));
    }
  }, [isOpen]);

  return (
    <section className="terminal-panel panel" aria-label={t("terminal.title")} hidden={!isOpen}>
      <div className="terminal-panel__bar" role="tablist" aria-label={t("terminal.tabs")}>
        {tabs.map((tab) => (
          <div key={tab.id} className="terminal-panel__tab" data-active={tab.id === activeId}>
            <button
              type="button"
              role="tab"
              aria-selected={tab.id === activeId}
              onClick={() => activate(tab.id)}
            >
              {tab.label}
            </button>
            <button
              type="button"
              aria-label={t("terminal.closeTab", { name: tab.label })}
              onClick={() => closeTab(tab.id)}
            >
              ×
            </button>
          </div>
        ))}
        <select
          className="terminal-panel__new"
          aria-label={t("terminal.new")}
          value=""
          onChange={(event) => {
            const profile = profiles.find((candidate) => candidate.id === event.target.value);
            if (profile) {
              openTab(profile.id, profile.label);
            }
          }}
        >
          <option value="">+ {t("terminal.new")}</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="terminal-panel__hide"
          aria-label={t("terminal.hide")}
          onClick={() => toggle()}
        >
          ⌄
        </button>
      </div>
      {error && (
        <p role="alert" className="terminal-panel__error">
          {error}
        </p>
      )}
      <div className="terminal-panel__body">
        {tabs.map((tab) => (
          <TerminalView key={tab.id} id={tab.id} isActive={tab.id === activeId} />
        ))}
      </div>
    </section>
  );
}
