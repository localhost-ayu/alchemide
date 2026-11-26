import { expect, test } from "vitest";
import { matchingPreset, PRESETS } from "./presets";

test("offers the three effect presets", () => {
  expect(PRESETS.map((preset) => preset.name)).toEqual(["Laboratório", "Focado", "Só wallpaper"]);
});

test("Focado turns every heavy effect off", () => {
  expect(PRESETS[1]?.effects).toEqual({
    surface: "solid",
    background: false,
    mascot: false,
    animations: false,
  });
});

test("recognizes the preset that matches the current effects", () => {
  expect(
    matchingPreset({ surface: "solid", background: true, mascot: false, animations: true })?.name,
  ).toBe("Só wallpaper");
  expect(
    matchingPreset({ surface: "glass", background: false, mascot: true, animations: true }),
  ).toBeNull();
});
