import { describe, expect, test } from "vitest";
import { BUILTIN_SOURCES, BUILTIN_THEMES, DEFAULT_THEME } from "./builtinThemes";
import { FALLBACK_THEME } from "./fallbackTheme";
import { parseTheme } from "./parseTheme";

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

test("Catalisador is the default theme", () => {
  expect(DEFAULT_THEME.name).toBe("Catalisador");
});

test("every built-in theme is valid and has a unique name", () => {
  for (const source of BUILTIN_SOURCES) {
    expect(parseTheme(source, FALLBACK_THEME).warnings).toEqual([]);
  }
  const names = BUILTIN_THEMES.map((theme) => theme.name);
  expect(new Set(names).size).toBe(names.length);
});

test("ships the three mood collections", () => {
  const moods = new Set(BUILTIN_THEMES.map((theme) => theme.mood));
  expect(moods).toEqual(new Set(["laboratorio", "ferreas", "calmas", "pasteis"]));
});

describe.each(BUILTIN_THEMES.map((theme) => [theme.name, theme] as const))("%s", (_name, theme) => {
  test("keeps text readable on the background", () => {
    expect(contrast(theme.ui.text, theme.ui.bg)).toBeGreaterThanOrEqual(7);
  });

  test("keeps every syntax color at WCAG AA contrast", () => {
    for (const color of Object.values(theme.syntax)) {
      expect(contrast(color, theme.ui.bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
