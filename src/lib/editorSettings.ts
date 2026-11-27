import { create } from "zustand";
import { DEFAULT_FONT, loadBundledFont } from "./fonts";
import { loadSettings, saveSettings, setZoom } from "./ipc";

export type EditorSettings = {
  fontFamily: string;
  fontSize: number;
  terminalFontSize: number;
  lineHeight: number;
  ligatures: boolean;
  zoom: number;
  tabSize: number;
  inlineBlame: boolean;
};

export const TAB_SIZES = [2, 4, 8] as const;

export const LIMITS = {
  fontSize: { min: 10, max: 28, step: 1 },
  terminalFontSize: { min: 10, max: 28, step: 1 },
  lineHeight: { min: 1.2, max: 2.2, step: 0.1 },
  zoom: { min: 0.7, max: 1.6, step: 0.05 },
} as const;

export const ZOOM_LEVELS = [0.75, 0.85, 0.9, 1, 1.1, 1.25, 1.4, 1.5];

export function nextZoom(current: number, direction: 1 | -1): number {
  const levels = direction === 1 ? ZOOM_LEVELS : [...ZOOM_LEVELS].reverse();
  return levels.find((level) => (level - current) * direction > 0.001) ?? current;
}

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontFamily: DEFAULT_FONT,
  fontSize: 14,
  terminalFontSize: 13,
  lineHeight: 1.6,
  ligatures: true,
  zoom: 1,
  tabSize: 2,
  inlineBlame: true,
};

const FONT_FALLBACK = '"Cascadia Code", "JetBrains Mono", ui-monospace, monospace';

type NumberField = keyof typeof LIMITS;

function readNumber(fields: Record<string, unknown>, field: NumberField): number {
  const value = fields[field];
  const { min, max } = LIMITS[field];
  if (typeof value !== "number" || value < min || value > max) {
    return DEFAULT_EDITOR_SETTINGS[field];
  }
  return Number(value.toFixed(2));
}

export function readEditorSettings(raw: unknown): EditorSettings {
  const fields = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const fontFamily =
    typeof fields.fontFamily === "string" &&
    fields.fontFamily.trim() !== "" &&
    !/[;{}<>]/.test(fields.fontFamily)
      ? fields.fontFamily.trim().slice(0, 120)
      : DEFAULT_EDITOR_SETTINGS.fontFamily;
  return {
    fontFamily,
    fontSize: Math.round(readNumber(fields, "fontSize")),
    terminalFontSize: Math.round(readNumber(fields, "terminalFontSize")),
    lineHeight: readNumber(fields, "lineHeight"),
    ligatures:
      typeof fields.ligatures === "boolean" ? fields.ligatures : DEFAULT_EDITOR_SETTINGS.ligatures,
    zoom: readNumber(fields, "zoom"),
    tabSize: TAB_SIZES.find((size) => size === fields.tabSize) ?? DEFAULT_EDITOR_SETTINGS.tabSize,
    inlineBlame:
      typeof fields.inlineBlame === "boolean"
        ? fields.inlineBlame
        : DEFAULT_EDITOR_SETTINGS.inlineBlame,
  };
}

export function fontStack(fontFamily: string): string {
  const quoted = fontFamily.includes(",") ? fontFamily : `"${fontFamily.replace(/"/g, "")}"`;
  return `${quoted}, ${FONT_FALLBACK}`;
}

let appliedZoom = 1;

function applyToDocument(settings: EditorSettings): void {
  const root = document.documentElement;
  root.style.setProperty("--font-code", fontStack(settings.fontFamily));
  root.style.setProperty("--editor-font-size", `${settings.fontSize}px`);
  root.style.setProperty("--editor-line-height", String(settings.lineHeight));
  root.style.setProperty("--code-ligatures", settings.ligatures ? "normal" : "none");
  void loadBundledFont(settings.fontFamily);
  if (settings.zoom !== appliedZoom) {
    appliedZoom = settings.zoom;
    setZoom(settings.zoom).catch(() => {});
  }
}

type EditorSettingsState = EditorSettings & {
  update: (changes: Partial<EditorSettings>) => Promise<void>;
};

function pick(state: EditorSettings): EditorSettings {
  const { fontFamily, fontSize, terminalFontSize, lineHeight, ligatures, zoom, tabSize } = state;
  const { inlineBlame } = state;
  return {
    fontFamily,
    fontSize,
    terminalFontSize,
    lineHeight,
    ligatures,
    zoom,
    tabSize,
    inlineBlame,
  };
}

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
