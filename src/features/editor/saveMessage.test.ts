import { expect, test } from "vitest";
import { saveMessage } from "./saveMessage";

test("uses the lab voice when playful touches are on", () => {
  expect(saveMessage("App.tsx", 42, true)).toBe("Experiment #42 saved: App.tsx");
});

test("falls back to a plain message when they are off", () => {
  expect(saveMessage("App.tsx", 42, false)).toBe("Saved App.tsx");
});
