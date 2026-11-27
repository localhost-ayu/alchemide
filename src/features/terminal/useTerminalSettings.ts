import { create } from "zustand";
import { loadSettings, saveSettings } from "../../lib/ipc";
import { PALETTE_NAMES } from "./terminalPalettes";

export const CURSOR_STYLES = ["block", "bar", "underline"] as const;
export const FOLLOW_THEME = "theme";

export type CursorStyle = (typeof CURSOR_STYLES)[number];

export type TerminalSettings = {
  palette: string;
  cursorStyle: CursorStyle;
  cursorBlink: boolean;
  padding: number;
  scrollback: number;
  fontFamily: string;
  lineHeight: number;
  visualBell: boolean;
};

export const TERMINAL_LIMITS = {
  padding: { min: 0, max: 32, step: 2 },
  scrollback: { min: 500, max: 100_000, step: 500 },
  lineHeight: { min: 1, max: 2, step: 0.1 },
} as const;

export const DEFAULT_TERMINAL_SETTINGS: TerminalSettings = {
  palette: FOLLOW_THEME,
  cursorStyle: "block",
  cursorBlink: true,
  padding: 4,
  scrollback: 5000,
  fontFamily: "",
  lineHeight: 1,
  visualBell: true,
};

function number(value: unknown, key: keyof typeof TERMINAL_LIMITS): number {
  const limits = TERMINAL_LIMITS[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_TERMINAL_SETTINGS[key];
  }
  return Math.min(limits.max, Math.max(limits.min, value));
}

export function readTerminalSettings(raw: unknown): TerminalSettings {
  const fields = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const flag = (key: "cursorBlink" | "visualBell") =>
    typeof fields[key] === "boolean" ? (fields[key] as boolean) : DEFAULT_TERMINAL_SETTINGS[key];
  return {
    palette:
      typeof fields.palette === "string" &&
      (fields.palette === FOLLOW_THEME || PALETTE_NAMES.includes(fields.palette))
        ? fields.palette
        : FOLLOW_THEME,
    cursorStyle: CURSOR_STYLES.find((style) => style === fields.cursorStyle) ?? "block",
    cursorBlink: flag("cursorBlink"),
    padding: Math.round(number(fields.padding, "padding")),
    scrollback: Math.round(number(fields.scrollback, "scrollback")),
    fontFamily:
      typeof fields.fontFamily === "string" && !/[;{}<>]/.test(fields.fontFamily)
        ? fields.fontFamily.trim().slice(0, 120)
        : "",
    lineHeight: Math.round(number(fields.lineHeight, "lineHeight") * 10) / 10,
    visualBell: flag("visualBell"),
  };
}

type State = TerminalSettings & {
  update: (changes: Partial<TerminalSettings>) => Promise<void>;
};

function pick(state: State): TerminalSettings {
  return readTerminalSettings(state);
}

export const useTerminalSettings = create<State>((set, get) => ({
  ...DEFAULT_TERMINAL_SETTINGS,
  update: async (changes) => {
    const next = readTerminalSettings({ ...pick(get()), ...changes });
    set(next);
    try {
      const settings = await loadSettings();
      await saveSettings({ ...settings, terminal: next });
    } catch {
      return;
    }
  },
}));

export async function initTerminalSettings(): Promise<void> {
  try {
    useTerminalSettings.setState(readTerminalSettings((await loadSettings()).terminal));
  } catch {
    return;
  }
}
