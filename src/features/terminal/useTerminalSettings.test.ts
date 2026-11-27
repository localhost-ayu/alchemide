import { beforeEach, expect, test } from "vitest";
import { loadSettings, saveSettings } from "../../lib/ipc.mock";
import { TERMINAL_PALETTES } from "./terminalPalettes";
import {
  DEFAULT_TERMINAL_SETTINGS,
  initTerminalSettings,
  readTerminalSettings,
  TERMINAL_LIMITS,
  useTerminalSettings,
} from "./useTerminalSettings";

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5]
    .map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastForTest(a: string, b: string): number {
  const [light = 0, dark = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

beforeEach(async () => {
  await saveSettings({});
  useTerminalSettings.setState(DEFAULT_TERMINAL_SETTINGS);
});

test("reads valid settings and falls back field by field", () => {
  expect(
    readTerminalSettings({ palette: "Ember", cursorStyle: "bar", padding: 12, scrollback: 9000 }),
  ).toMatchObject({ palette: "Ember", cursorStyle: "bar", padding: 12, scrollback: 9000 });
  expect(
    readTerminalSettings({
      palette: "Unknown",
      cursorStyle: "triangle",
      padding: 99,
      scrollback: 1,
      fontFamily: "x; } body {",
      lineHeight: "tall",
    }),
  ).toEqual({
    ...DEFAULT_TERMINAL_SETTINGS,
    padding: TERMINAL_LIMITS.padding.max,
    scrollback: TERMINAL_LIMITS.scrollback.min,
  });
  expect(readTerminalSettings(null)).toEqual(DEFAULT_TERMINAL_SETTINGS);
});

test("saves changes next to the other settings and restores them on start", async () => {
  await saveSettings({ theme: "Maré" });

  await useTerminalSettings.getState().update({ palette: "Reagent", cursorBlink: false });
  expect(await loadSettings()).toMatchObject({
    theme: "Maré",
    terminal: { palette: "Reagent", cursorBlink: false },
  });

  useTerminalSettings.setState(DEFAULT_TERMINAL_SETTINGS);
  await initTerminalSettings();
  expect(useTerminalSettings.getState().palette).toBe("Reagent");
});

test.each(Object.entries(TERMINAL_PALETTES))(
  "the %s palette keeps text readable",
  (_name, palette) => {
    const background = palette.background ?? "";
    expect(contrastForTest(palette.foreground ?? "", background)).toBeGreaterThanOrEqual(7);
    for (const key of [
      "red",
      "green",
      "yellow",
      "blue",
      "magenta",
      "cyan",
      "brightBlack",
    ] as const) {
      expect(contrastForTest(palette[key] ?? "", background), key).toBeGreaterThanOrEqual(4.5);
    }
  },
);
