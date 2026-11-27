import { expect, test } from "vitest";
import { contrast, fromColorInput, toColorInput } from "./colors";

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
