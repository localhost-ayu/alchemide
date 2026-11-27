import { expect, test } from "vitest";
import { isAnimatedFormat, positionFor } from "./mascotPlacement";

const area = { left: 100, top: 50, width: 1100, height: 650 };
const mascot = { left: 0, top: 0, width: 100, height: 150 };

test("turns where the mascot is dropped into a fraction of the free room", () => {
  expect(positionFor(area, mascot, 100, 50)).toEqual({ x: 0, y: 0 });
  expect(positionFor(area, mascot, 1100, 550)).toEqual({ x: 1, y: 1 });
  expect(positionFor(area, mascot, 600, 300)).toEqual({ x: 0.5, y: 0.5 });
});

test("keeps the mascot inside the area", () => {
  expect(positionFor(area, mascot, -500, 9999)).toEqual({ x: 0, y: 1 });
  expect(positionFor({ ...area, width: 80 }, mascot, 300, 50)).toEqual({ x: 0, y: 0 });
});

test("knows which images can move", () => {
  expect(isAnimatedFormat("mascots/dance.GIF")).toBe(true);
  expect(isAnimatedFormat("mascots/idle.webp")).toBe(true);
  expect(isAnimatedFormat("mascots/still.png")).toBe(false);
});
