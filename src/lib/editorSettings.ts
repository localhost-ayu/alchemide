import { create } from "zustand";
import { loadSettings, saveSettings } from "./ipc";

export type EditorSettings = {
  fontFamily: string;
  fontSize: number;
  tabSize: number;
};

export const TAB_SIZES = [2, 4, 8] as const;

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontFamily: "",
  fontSize: 14,
  tabSize: 2,
};

const FONT_FALLBACK = '"Maple Mono", "Cascadia Code", "JetBrains Mono", ui-monospace, monospace';

export function readEditorSettings(raw: unknown): EditorSettings {
  const fields = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const fontFamily =
    typeof fields.fontFamily === "string" && !/[;{}<>]/.test(fields.fontFamily)
      ? fields.fontFamily.trim().slice(0, 120)
      : DEFAULT_EDITOR_SETTINGS.fontFamily;
  const fontSize =
    typeof fields.fontSize === "number" && fields.fontSize >= 10 && fields.fontSize <= 28
      ? Math.round(fields.fontSize)
      : DEFAULT_EDITOR_SETTINGS.fontSize;
  const tabSize =
    TAB_SIZES.find((size) => size === fields.tabSize) ?? DEFAULT_EDITOR_SETTINGS.tabSize;
  return { fontFamily, fontSize, tabSize };
}

export function fontStack(fontFamily: string): string {
  if (!fontFamily) {
    return FONT_FALLBACK;
  }
  const quoted = fontFamily.includes(",") ? fontFamily : `"${fontFamily.replace(/"/g, "")}"`;
  return `${quoted}, ${FONT_FALLBACK}`;
}

function applyToDocument(settings: EditorSettings): void {
  const root = document.documentElement;
  root.style.setProperty("--font-code", fontStack(settings.fontFamily));
  root.style.setProperty("--editor-font-size", `${settings.fontSize}px`);
}

type EditorSettingsState = EditorSettings & {
  update: (changes: Partial<EditorSettings>) => Promise<void>;
};

export const useEditorSettings = create<EditorSettingsState>((set, get) => ({
  ...DEFAULT_EDITOR_SETTINGS,
  update: async (changes) => {
    const next = readEditorSettings({ ...pick(get()), ...changes });
    set(next);
    applyToDocument(next);
    const settings = await loadSettings();
    await saveSettings({ ...settings, editor: next });
  },
}));

function pick(state: EditorSettings): EditorSettings {
  return { fontFamily: state.fontFamily, fontSize: state.fontSize, tabSize: state.tabSize };
}

export async function initEditorSettings(): Promise<void> {
  applyToDocument(DEFAULT_EDITOR_SETTINGS);
  try {
    const settings = readEditorSettings((await loadSettings()).editor);
    useEditorSettings.setState(settings);
    applyToDocument(settings);
  } catch {
    return;
  }
}
