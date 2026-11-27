import { describe, expect, test } from "vitest";
import { BUILTIN_THEMES } from "./builtinThemes";
import { contrast } from "./colors";
import { controlColors } from "./controlColors";

const dark = {
  bg: "#120f1a",
  panel: "#1b1726",
  accent: "#b6f24a",
  accent2: "#ff7ac6",
  text: "#e9e4f5",
};

test("uses an opaque background between the page and the panels", () => {
  const { background } = controlColors(dark);
  expect(background).toMatch(/^#[0-9a-f]{6}$/);
  expect(background).toBe("#171421");
});

test("keeps the theme text when it is readable and picks black or white otherwise", () => {
  expect(controlColors(dark).text).toBe("#e9e4f5");
  expect(controlColors({ ...dark, text: "#1b1726" }).text).toBe("#ffffff");
  const light = {
    bg: "#f7f4fb",
    panel: "#ece6f5",
    accent: "#7a5cc2",
    accent2: "#c25c94",
    text: "#f0f0f0",
  };
  expect(controlColors(light).text).toBe("#000000");
});

test("tells native widgets whether the theme is dark or light", () => {
  expect(controlColors(dark).scheme).toBe("dark");
  expect(controlColors({ ...dark, bg: "#fdf6f1", panel: "#f6e8de" }).scheme).toBe("light");
});

describe.each(BUILTIN_THEMES.map((theme) => [theme.name, theme] as const))("%s", (_name, theme) => {
  test("form controls reach WCAG AA contrast", () => {
    const { background, text } = controlColors(theme.ui);
    expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5);
  });
});

test("picks a knob color that stands out on the accent", () => {
  expect(controlColors(dark).onAccent).toBe("#120f1a");
  const pale = { ...dark, bg: "#d0ffa0", accent: "#b6f24a" };
  expect(contrast(controlColors(pale).onAccent, pale.accent)).toBeGreaterThanOrEqual(3);
  for (const theme of BUILTIN_THEMES) {
    expect(contrast(controlColors(theme.ui).onAccent, theme.ui.accent)).toBeGreaterThanOrEqual(3);
  }
});
