import { expect, test } from "vitest";
import { contrast, fromColorInput, minimumPanelOpacity, mixColors, toColorInput } from "./colors";

test("turns any theme hex color into the six digits a color input accepts", () => {
  expect(toColorInput("#ABC")).toBe("#aabbcc");
  expect(toColorInput("#b6f24a")).toBe("#b6f24a");
  expect(toColorInput("#b6f24a80")).toBe("#b6f24a");
  expect(toColorInput("#abcd")).toBe("#aabbcc");
});

test("keeps the alpha of the previous color when a new one is picked", () => {
  expect(fromColorInput("#FF0000", "#b6f24a")).toBe("#ff0000");
  expect(fromColorInput("#ff0000", "#b6f24a80")).toBe("#ff000080");
  expect(fromColorInput("#ff0000", "#abcd")).toBe("#ff0000dd");
});

test("measures contrast like WCAG", () => {
  expect(contrast("#000000", "#ffffff")).toBeCloseTo(21);
  expect(contrast("#ffffff", "#000000")).toBeCloseTo(21);
  expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  expect(contrast("#fff", "#ffffff")).toBe(1);
});

test("mixes a color over another by its opacity", () => {
  expect(mixColors("#000000", "#ffffff", 0.5)).toBe("#808080");
  expect(mixColors("#102030", "#102030", 0.3)).toBe("#102030");
});

test("suggests the lowest panel opacity that keeps text readable over any image", () => {
  const suggested = minimumPanelOpacity("#1b1726", "#e9e4f5", 0.3, 0);

  expect(suggested).not.toBeNull();
  expect(suggested).toBeGreaterThan(0.3);
  expect(minimumPanelOpacity("#1b1726", "#e9e4f5", suggested ?? 1, 0)).toBeNull();
  expect(minimumPanelOpacity("#1b1726", "#e9e4f5", (suggested ?? 1) - 0.01, 0)).not.toBeNull();
});

test("needs less panel opacity when the image is dimmed", () => {
  const plain = minimumPanelOpacity("#1b1726", "#e9e4f5", 0.2, 0);
  const dimmed = minimumPanelOpacity("#1b1726", "#e9e4f5", 0.2, 0.3);

  expect(plain).not.toBeNull();
  expect(dimmed).not.toBeNull();
  expect(dimmed ?? 1).toBeLessThan(plain ?? 1);
  expect(minimumPanelOpacity("#1b1726", "#e9e4f5", 0.2, 0.9)).toBeNull();
});
