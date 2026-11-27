import { create } from "zustand";
import { listUserThemes, loadSettings, saveSettings } from "../../lib/ipc";
import { applyEffects, applyTheme } from "./applyTheme";
import { BUILTIN_THEMES, DEFAULT_THEME } from "./builtinThemes";
import { type CustomLook, NO_CUSTOM_LOOK, readCustomLook, withCustomLook } from "./customLook";
import { readEffects } from "./parseTheme";
import type { Effects, Theme } from "./theme";
import { nameKey, readUserThemes, type UserTheme } from "./userThemes";

type ThemeState = {
  theme: Theme;
  effects: Effects;
  custom: CustomLook;
  userThemes: UserTheme[];
  warnings: string[];
  preview: (theme: Theme, effects?: Effects) => void;
  commit: (theme: Theme, effects: Effects) => Promise<void>;
  setCustom: (custom: Partial<CustomLook>) => Promise<void>;
  dismissWarnings: () => void;
};

function show(theme: Theme, effects: Effects, custom: CustomLook): void {
  applyTheme(withCustomLook(theme, custom));
  applyEffects(effects);
}

async function persist(state: Pick<ThemeState, "theme" | "effects" | "custom">): Promise<void> {
  const settings = await loadSettings();
  await saveSettings({
    ...settings,
    theme: state.theme.name,
    effects: state.effects,
    background: state.custom.background,
    mascot: state.custom.mascot,
  });
}

export const useThemeStore = create<ThemeState>((set, get) => {
  const save = async () => {
    try {
      await persist(get());
    } catch (error) {
      set({ warnings: [`could not save the look: ${String(error)}`] });
    }
  };
  return {
    theme: DEFAULT_THEME,
    effects: DEFAULT_THEME.effects,
    custom: NO_CUSTOM_LOOK,
    userThemes: [],
    warnings: [],
    preview: (theme, effects = theme.effects) => show(theme, effects, get().custom),
    commit: async (theme, effects) => {
      show(theme, effects, get().custom);
      set({ theme, effects });
      await save();
    },
    setCustom: async (changes) => {
      const custom = { ...get().custom, ...changes };
      show(get().theme, get().effects, custom);
      set({ custom });
      await save();
    },
    dismissWarnings: () => set({ warnings: [] }),
  };
});

export function allThemes(userThemes: UserTheme[]): Theme[] {
  return [...BUILTIN_THEMES, ...userThemes.map((userTheme) => userTheme.theme)];
}

export function findTheme(name: unknown): Theme | null {
  if (typeof name !== "string") {
    return null;
  }
  const themes = allThemes(useThemeStore.getState().userThemes);
  return themes.find((theme) => nameKey(theme.name) === nameKey(name)) ?? null;
}

async function loadUserThemes(): Promise<boolean> {
  try {
    const { themes, warnings } = readUserThemes(await listUserThemes(), BUILTIN_THEMES);
    useThemeStore.setState({ userThemes: themes, warnings });
    return true;
  } catch (error) {
    useThemeStore.setState({ warnings: [`could not load your themes: ${String(error)}`] });
    return false;
  }
}

export async function reloadUserThemes(): Promise<void> {
  if (!(await loadUserThemes())) {
    return;
  }
  const { theme, effects, custom } = useThemeStore.getState();
  const current = findTheme(theme.name) ?? DEFAULT_THEME;
  show(current, effects, custom);
  useThemeStore.setState({ theme: current });
}

export async function initThemes(): Promise<void> {
  const apply = (theme: Theme, effects: Effects, custom: CustomLook) => {
    show(theme, effects, custom);
    useThemeStore.setState({ theme, effects, custom });
  };
  apply(DEFAULT_THEME, DEFAULT_THEME.effects, NO_CUSTOM_LOOK);
  await loadUserThemes();
  try {
    const settings = await loadSettings();
    const theme = findTheme(settings.theme) ?? DEFAULT_THEME;
    const effects = settings.effects === undefined ? theme.effects : readEffects(settings.effects);
    apply(theme, effects, readCustomLook(settings, theme));
  } catch {
    return;
  }
}
