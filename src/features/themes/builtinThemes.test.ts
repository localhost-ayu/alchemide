import { describe, expect, test } from "vitest";
import { BUILTIN_SOURCES, BUILTIN_THEMES, DEFAULT_THEME } from "./builtinThemes";
import { AA_CONTRAST, contrast } from "./colors";
import { FALLBACK_THEME } from "./fallbackTheme";
import { parseTheme } from "./parseTheme";

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
      expect(contrast(color, theme.ui.bg)).toBeGreaterThanOrEqual(AA_CONTRAST);
    }
  });
});
