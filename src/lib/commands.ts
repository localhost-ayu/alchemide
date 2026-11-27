import { create } from "zustand";

export const CHORD_WINDOW_MS = 1500;

export type Command = {
  id: string;
  title: string;
  keys?: string;
  run: () => void;
};

type KeyLike = {
  key: string;
  code?: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
};

export type KeyOverrides = Record<string, string | null>;

type CommandState = {
  commands: Record<string, Command>;
  overrides: KeyOverrides;
};

export const useCommandStore = create<CommandState>(() => ({ commands: {}, overrides: {} }));

export function effectiveKeys(command: Command, overrides: KeyOverrides): string | undefined {
  if (command.id in overrides) {
    return overrides[command.id] ?? undefined;
  }
  return command.keys;
}

export function findConflicts(
  commands: Command[],
  overrides: KeyOverrides,
): Record<string, string[]> {
  const byKeys: Record<string, string[]> = {};
  for (const command of commands) {
    const keys = effectiveKeys(command, overrides);
    if (keys) {
      byKeys[keys] = [...(byKeys[keys] ?? []), command.id];
    }
  }
  return Object.fromEntries(Object.entries(byKeys).filter(([, ids]) => ids.length > 1));
}

let recording = false;

export function setRecording(on: boolean): void {
  recording = on;
}

export function isRecording(): boolean {
  return recording;
}

let pendingChord: { stroke: string; at: number } | null = null;
let listening = false;

function listen(): void {
  if (listening || typeof window === "undefined") {
    return;
  }
  listening = true;
  window.addEventListener("keydown", (event) => dispatchKey(event));
}

export function registerCommands(commands: Command[]): () => void {
  listen();
  useCommandStore.setState((state) => ({
    commands: { ...state.commands, ...Object.fromEntries(commands.map((c) => [c.id, c])) },
  }));
  return () =>
    useCommandStore.setState((state) => {
      const next = { ...state.commands };
      for (const command of commands) {
        if (next[command.id] === command) {
          delete next[command.id];
        }
      }
      return { commands: next };
    });
}

function keyName(event: KeyLike): string {
  if (event.code === "Backquote" || event.key === "`") {
    return "`";
  }
  return event.key.length === 1 ? event.key.toUpperCase() : event.key;
}

export function strokeOf(event: KeyLike): string {
  const parts: string[] = [];
  if (event.ctrlKey || event.metaKey) {
    parts.push("Ctrl");
  }
  if (event.altKey) {
    parts.push("Alt");
  }
  if (event.shiftKey) {
    parts.push("Shift");
  }
  parts.push(keyName(event));
  return parts.join("+");
}

function bindings(): { command: Command; strokes: string[] }[] {
  const { commands, overrides } = useCommandStore.getState();
  return Object.values(commands).flatMap((command) => {
    const keys = effectiveKeys(command, overrides);
    return keys ? [{ command, strokes: keys.split(" ") }] : [];
  });
}

function chordIsPending(now: number): boolean {
  return pendingChord !== null && now - pendingChord.at < CHORD_WINDOW_MS;
}

export function findCommand(event: KeyLike, now = Date.now()): Command | "chord" | null {
  const stroke = strokeOf(event);
  if (chordIsPending(now) && pendingChord) {
    const first = pendingChord.stroke;
    const second = stroke.replace(/^Shift\+/, "");
    const match = bindings().find(
      ({ strokes }) => strokes.length === 2 && strokes[0] === first && strokes[1] === second,
    );
    if (match) {
      return match.command;
    }
  }
  const single = bindings().find(({ strokes }) => strokes.length === 1 && strokes[0] === stroke);
  if (single) {
    return single.command;
  }
  const startsChord = bindings().some(
    ({ strokes }) => strokes.length === 2 && strokes[0] === stroke,
  );
  return startsChord ? "chord" : null;
}

export function dispatchKey(event: KeyLike & { preventDefault: () => void }, now = Date.now()) {
  if (recording) {
    return;
  }
  const found = findCommand(event, now);
  if (found === null) {
    if (!["Control", "Shift", "Alt", "Meta"].includes(event.key)) {
      pendingChord = null;
    }
    return;
  }
  event.preventDefault();
  if (found === "chord") {
    pendingChord = { stroke: strokeOf(event), at: now };
    return;
  }
  pendingChord = null;
  found.run();
}

export function keyBelongsToApp(event: KeyLike, now = Date.now()): boolean {
  if (recording) {
    return true;
  }
  return chordIsPending(now) || findCommand(event, now) !== null;
}

export function resetChord(): void {
  pendingChord = null;
}

export function runCommand(id: string): void {
  useCommandStore.getState().commands[id]?.run();
}
