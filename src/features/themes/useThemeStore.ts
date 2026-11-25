import { create } from "zustand";
import { loadSettings, saveSettings } from "../../lib/ipc";
import { applyEffects, applyTheme } from "./applyTheme";
import { BUILTIN_THEMES, DEFAULT_THEME } from "./builtinThemes";
import { readEffects } from "./parseTheme";
import type { Effects, Theme } from "./theme";

type ThemeState = {
  theme: Theme;
  effects: Effects;
  warnings: string[];
  preview: (theme: Theme, effects?: Effects) => void;
  commit: (theme: Theme, effects: Effects) => Promise<void>;
  dismissWarnings: () => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: DEFAULT_THEME,
  effects: DEFAULT_THEME.effects,
  warnings: [],
  preview: (theme, effects = theme.effects) => {
    applyTheme(theme);
    applyEffects(effects);
  },
  commit: async (theme, effects) => {
    applyTheme(theme);
    applyEffects(effects);
    set({ theme, effects });
    try {
      const settings = await loadSettings();
      await saveSettings({ ...settings, theme: theme.name, effects });
    } catch (error) {
      set({ warnings: [`could not save the theme: ${String(error)}`] });
    }
  },
  dismissWarnings: () => set({ warnings: [] }),
}));

export function findTheme(name: unknown): Theme | null {
  return BUILTIN_THEMES.find((theme) => theme.name === name) ?? null;
}

export async function initThemes(): Promise<void> {
  const apply = (theme: Theme, effects: Effects) => {
    applyTheme(theme);
    applyEffects(effects);
    useThemeStore.setState({ theme, effects });
  };
  apply(DEFAULT_THEME, DEFAULT_THEME.effects);
  try {
    const settings = await loadSettings();
    const theme = findTheme(settings.theme) ?? DEFAULT_THEME;
    const effects = settings.effects === undefined ? theme.effects : readEffects(settings.effects);
    apply(theme, effects);
  } catch {
    return;
  }
}
