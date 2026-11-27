import { loadSettings, saveSettings } from "../../lib/ipc";
import type { Theme } from "./theme";

export const MAX_RECENT_COLORS = 8;

const HEX6 = /^#[0-9a-f]{6}$/i;

export function readRecentColors(raw: unknown): string[] {
  return Array.isArray(raw)
    ? raw.filter((color): color is string => typeof color === "string" && HEX6.test(color))
    : [];
}

export function rememberColors(recent: string[], picked: string[]): string[] {
  const seen = new Set<string>();
  return [...picked, ...recent]
    .map((color) => color.slice(0, 7).toLowerCase())
    .filter((color) => HEX6.test(color) && !seen.has(color) && seen.add(color))
    .slice(0, MAX_RECENT_COLORS);
}

export function changedColors(before: Theme, after: Theme): string[] {
  const pairs = [
    ...Object.entries(after.ui).map(([key, color]) => [color, before.ui[key as keyof Theme["ui"]]]),
    ...Object.entries(after.syntax).map(([key, color]) => [
      color,
      before.syntax[key as keyof Theme["syntax"]],
    ]),
  ];
  return pairs.filter(([color, previous]) => color !== previous).map(([color]) => color ?? "");
}

export async function loadRecentColors(): Promise<string[]> {
  try {
    return readRecentColors((await loadSettings()).recentColors);
  } catch {
    return [];
  }
}

export async function addRecentColors(picked: string[]): Promise<void> {
  if (picked.length === 0) {
    return;
  }
  const settings = await loadSettings();
  const recentColors = rememberColors(readRecentColors(settings.recentColors), picked);
  await saveSettings({ ...settings, recentColors });
}
