import { BUILTIN_THEMES } from "./builtinThemes";
import type { CustomLook } from "./customLook";
import { PRESETS, type Preset } from "./presets";
import type { Theme } from "./theme";

export type LookAction = "pick-background" | "pick-mascot" | "clear-background" | "clear-mascot";

export type MoodOption =
  | { kind: "action"; id: string; label: string; group: string; action: LookAction }
  | { kind: "theme"; id: string; label: string; group: string; theme: Theme }
  | { kind: "preset"; id: string; label: string; group: string; preset: Preset };

const GROUPS: Record<string, string> = {
  laboratorio: "Laboratório",
  ferreas: "Férreas",
  calmas: "Calmas",
  pasteis: "Pastéis",
};

const ACTION_LABELS: Record<LookAction, string> = {
  "pick-background": "Choose background image or video…",
  "pick-mascot": "Choose mascot image…",
  "clear-background": "Remove custom background",
  "clear-mascot": "Remove mascot",
};

function actionOptions(custom: CustomLook): MoodOption[] {
  const actions: LookAction[] = ["pick-background", "pick-mascot"];
  if (custom.background) {
    actions.push("clear-background");
  }
  if (custom.mascot) {
    actions.push("clear-mascot");
  }
  return actions.map((action) => ({
    kind: "action",
    id: `action:${action}`,
    label: ACTION_LABELS[action],
    group: "Personalizar",
    action,
  }));
}

export function moodOptions(
  themes: Theme[] = BUILTIN_THEMES,
  custom: CustomLook = { background: null, mascot: null },
): MoodOption[] {
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
  return [...themeOptions, ...presetOptions, ...actionOptions(custom)];
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
