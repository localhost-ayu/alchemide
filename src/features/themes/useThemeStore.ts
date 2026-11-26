import { create } from "zustand";
import { applyEffects, applyTheme } from "./applyTheme";
import { DEFAULT_THEME } from "./builtinThemes";
import type { Effects, Theme } from "./theme";

type ThemeState = {
  theme: Theme;
  effects: Effects;
  warnings: string[];
  selectTheme: (theme: Theme, warnings?: string[]) => void;
  setEffects: (effects: Partial<Effects>) => void;
  dismissWarnings: () => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: DEFAULT_THEME,
  effects: DEFAULT_THEME.effects,
  warnings: [],
  selectTheme: (theme, warnings = []) => {
    applyTheme(theme);
    applyEffects(theme.effects);
    set({ theme, effects: theme.effects, warnings });
  },
  setEffects: (effects) => {
    applyEffects(effects);
    set({ effects: { ...get().effects, ...effects } });
  },
  dismissWarnings: () => set({ warnings: [] }),
}));

export function initThemes(): void {
  const { theme, selectTheme } = useThemeStore.getState();
  selectTheme(theme);
}
