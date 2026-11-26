import { describe, expect, test } from "vitest";
import { CHORD_WINDOW_MS, isChordStart, reachesApp } from "./appShortcuts";

const key = (overrides: Partial<Parameters<typeof reachesApp>[0]>) => ({
  key: "a",
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  ...overrides,
});
const NO_CHORD = Number.POSITIVE_INFINITY;

describe("reachesApp", () => {
  test.each([
    ["Ctrl+`", key({ key: "`", ctrlKey: true })],
    ["Ctrl+` by key code", key({ key: "Dead", code: "Backquote", ctrlKey: true })],
    ["Ctrl+B", key({ key: "b", ctrlKey: true })],
    ["Ctrl+K", key({ key: "K", ctrlKey: true })],
    ["Ctrl+Alt+M", key({ key: "m", ctrlKey: true, altKey: true })],
  ])("sends %s to the app", (_name, event) => {
    expect(reachesApp(event, NO_CHORD)).toBe(true);
  });

  test.each([
    ["plain letters", key({ key: "m" })],
    ["Ctrl+C", key({ key: "c", ctrlKey: true })],
    ["Ctrl+R", key({ key: "r", ctrlKey: true })],
    ["Enter", key({ key: "Enter" })],
  ])("keeps %s in the shell", (_name, event) => {
    expect(reachesApp(event, NO_CHORD)).toBe(false);
  });

  test("sends the second key of a Ctrl+K chord to the app", () => {
    expect(reachesApp(key({ key: "m" }), 200)).toBe(true);
    expect(reachesApp(key({ key: "m" }), CHORD_WINDOW_MS + 1)).toBe(false);
  });
});

test("recognizes the start of a chord", () => {
  expect(isChordStart(key({ key: "k", ctrlKey: true }))).toBe(true);
  expect(isChordStart(key({ key: "k", ctrlKey: true, altKey: true }))).toBe(false);
  expect(isChordStart(key({ key: "k" }))).toBe(false);
});
