import { BUILTIN_THEMES } from "./builtinThemes";
import { PRESETS, type Preset } from "./presets";
import type { Theme } from "./theme";

export type MoodOption =
  | { kind: "theme"; id: string; label: string; group: string; theme: Theme }
  | { kind: "preset"; id: string; label: string; group: string; preset: Preset };

const GROUPS: Record<string, string> = {
  laboratorio: "Laboratório",
  ferreas: "Férreas",
  calmas: "Calmas",
  pasteis: "Pastéis",
};

export function moodOptions(themes: Theme[] = BUILTIN_THEMES): MoodOption[] {
  const themeOptions: MoodOption[] = themes.map((theme) => ({
    kind: "theme",
    id: `theme:${theme.name}`,
    label: theme.name,
    group: GROUPS[theme.mood] ?? "Outros",
    theme,
  }));
  const presetOptions: MoodOption[] = PRESETS.map((preset) => ({
    kind: "preset",
    id: `preset:${preset.name}`,
    label: preset.name,
    group: "Efeitos",
    preset,
  }));
  return [...themeOptions, ...presetOptions];
}

export function filterOptions(options: MoodOption[], query: string): MoodOption[] {
  const needle = normalize(query.trim());
  if (!needle) {
    return options;
  }
  return options.filter((option) => normalize(`${option.label} ${option.group}`).includes(needle));
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
