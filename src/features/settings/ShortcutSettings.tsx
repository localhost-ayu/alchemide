import { useEffect, useMemo, useState } from "react";
import {
  effectiveKeys,
  findConflicts,
  setRecording,
  strokeOf,
  useCommandStore,
} from "../../lib/commands";
import { resetShortcut, setShortcut } from "../../lib/keybindings";

const MODIFIERS = ["Control", "Shift", "Alt", "Meta"];
export const CHORD_WAIT_MS = 1000;

function useShortcutRecorder(id: string | null, onDone: () => void): void {
  useEffect(() => {
    if (!id) {
      return;
    }
    setRecording(true);
    let first: string | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (keys: string | null) => {
      clearTimeout(timer);
      if (keys) {
        void setShortcut(id, keys);
      }
      onDone();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (MODIFIERS.includes(event.key)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "Escape") {
        finish(null);
        return;
      }
      const stroke = strokeOf(event);
      if (first === null) {
        first = stroke;
        const single = stroke;
        timer = setTimeout(() => finish(single), CHORD_WAIT_MS);
        return;
      }
      finish(`${first} ${stroke.replace(/^Shift\+/, "")}`);
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown, true);
      setRecording(false);
    };
  }, [id, onDone]);
}

export function ShortcutSettings() {
  const commands = useCommandStore((state) => state.commands);
  const overrides = useCommandStore((state) => state.overrides);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const sorted = useMemo(
    () => Object.values(commands).sort((a, b) => a.title.localeCompare(b.title)),
    [commands],
  );
  const conflicts = useMemo(() => findConflicts(sorted, overrides), [sorted, overrides]);
  const stopRecording = useMemo(() => () => setRecordingId(null), []);
  useShortcutRecorder(recordingId, stopRecording);

  return (
    <section className="settings__section" aria-label="Keyboard shortcuts">
      <h3>Keyboard shortcuts</h3>
      {sorted.map((command) => {
        const keys = effectiveKeys(command, overrides);
        const others = keys ? (conflicts[keys] ?? []).filter((id) => id !== command.id) : [];
        const recording = recordingId === command.id;
        return (
          <div key={command.id} className="settings__field settings__shortcut">
            <span>
              {command.title}
              {others.length > 0 && (
                <span className="settings__problem">
                  {" "}
                  · also used by {others.map((id) => commands[id]?.title ?? id).join(", ")}
                </span>
              )}
            </span>
            <span className="settings__shortcut-keys">
              <kbd aria-label={`Shortcut for ${command.title}`}>
                {recording ? "Press keys…" : (keys ?? "—")}
              </kbd>
              <button
                type="button"
                aria-label={`Change shortcut for ${command.title}`}
                onClick={() => setRecordingId(command.id)}
              >
                Change
              </button>
              <button
                type="button"
                aria-label={`Remove shortcut for ${command.title}`}
                disabled={!keys}
                onClick={() => setShortcut(command.id, null)}
              >
                Remove
              </button>
              <button
                type="button"
                aria-label={`Reset shortcut for ${command.title}`}
                disabled={!(command.id in overrides)}
                onClick={() => resetShortcut(command.id)}
              >
                Reset
              </button>
            </span>
          </div>
        );
      })}
    </section>
  );
}
