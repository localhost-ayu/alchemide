import { useEffect, useState } from "react";
import { registerCommands } from "../../lib/commands";
import { onTerminalExit, terminalProfiles } from "../../lib/ipc";
import type { TerminalProfile } from "../../lib/types";
import { TerminalView } from "./TerminalView";
import { useTerminalStore } from "./useTerminalStore";
import "./Terminal.css";

export function TerminalPanel() {
  const isOpen = useTerminalStore((state) => state.isOpen);
  const tabs = useTerminalStore((state) => state.tabs);
  const activeId = useTerminalStore((state) => state.activeId);
  const error = useTerminalStore((state) => state.error);
  const { toggle, openTab, closeTab, activate } = useTerminalStore.getState();
  const [profiles, setProfiles] = useState<TerminalProfile[]>([]);

  useEffect(() => {
    const unregister = registerCommands([
      {
        id: "terminal.toggle",
        title: "Toggle terminal",
        keys: "Ctrl+`",
        run: () => useTerminalStore.getState().toggle(),
      },
      {
        id: "terminal.new",
        title: "New terminal",
        run: () => useTerminalStore.getState().openTab(null, "Terminal"),
      },
    ]);
    const exit = onTerminalExit((id) => useTerminalStore.getState().removeTab(id));
    return () => {
      unregister();
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
    <section className="terminal-panel panel" aria-label="Terminal" hidden={!isOpen}>
      <div className="terminal-panel__bar" role="tablist" aria-label="Terminals">
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
              aria-label={`Close ${tab.label}`}
              onClick={() => closeTab(tab.id)}
            >
              ×
            </button>
          </div>
        ))}
        <select
          className="terminal-panel__new"
          aria-label="New terminal"
          value=""
          onChange={(event) => {
            const profile = profiles.find((candidate) => candidate.id === event.target.value);
            if (profile) {
              openTab(profile.id, profile.label);
            }
          }}
        >
          <option value="">+ New terminal</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="terminal-panel__hide"
          aria-label="Hide terminal"
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
