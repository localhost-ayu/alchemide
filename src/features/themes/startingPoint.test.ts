import { expect, test } from "vitest";
import { FALLBACK_THEME } from "./fallbackTheme";
import { applyStartingPoint } from "./startingPoint";
import type { Theme } from "./theme";

const start: Theme = {
  ...FALLBACK_THEME,
  name: "Papel",
  ui: { ...FALLBACK_THEME.ui, bg: "#f4f1ea" },
  background: { type: "solid", color: "#f4f1ea" },
  glass: { panelOpacity: 1, blur: 0 },
  shape: { radius: 2, font: "serif" },
};

test("takes colors, glass and shape from the starting point and keeps the name", () => {
  const result = applyStartingPoint({ ...FALLBACK_THEME, name: "Meu tema" }, start);

  expect(result.name).toBe("Meu tema");
  expect(result.ui.bg).toBe("#f4f1ea");
  expect(result.shape).toEqual({ radius: 2, font: "serif" });
  expect(result.glass).toEqual({ panelOpacity: 1, blur: 0 });
  expect(result.background).toEqual({ type: "solid", color: "#f4f1ea" });
});

test("keeps a background image when switching starting points", () => {
  const image = { type: "image", path: "a.png", fit: "cover", blur: 0, dim: 0.4 } as const;

  const result = applyStartingPoint({ ...FALLBACK_THEME, background: image }, start);

  expect(result.background).toEqual(image);
});
