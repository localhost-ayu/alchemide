import type { Effects } from "./theme";

export type Preset = {
  name: string;
  effects: Effects;
};

export const PRESETS: Preset[] = [
  {
    name: "Laboratório",
    effects: { surface: "glass", background: true, mascot: true, animations: true },
  },
  {
    name: "Focado",
    effects: { surface: "solid", background: false, mascot: false, animations: false },
  },
  {
    name: "Só wallpaper",
    effects: { surface: "solid", background: true, mascot: false, animations: true },
  },
];

export function matchingPreset(effects: Effects): Preset | null {
  return (
    PRESETS.find((preset) =>
      (Object.keys(preset.effects) as (keyof Effects)[]).every(
        (key) => preset.effects[key] === effects[key],
      ),
    ) ?? null
  );
}
