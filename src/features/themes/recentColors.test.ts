import { beforeEach, expect, test } from "vitest";
import { loadSettings, saveSettings } from "../../lib/ipc.mock";
import { FALLBACK_THEME } from "./fallbackTheme";
import {
  addRecentColors,
  changedColors,
  loadRecentColors,
  MAX_RECENT_COLORS,
  readRecentColors,
  rememberColors,
} from "./recentColors";

beforeEach(() => saveSettings({}));

test("keeps only valid six-digit colors from the settings", () => {
  expect(readRecentColors(["#ff0000", "red", 3, "#abc", "#00FF00"])).toEqual([
    "#ff0000",
    "#00FF00",
  ]);
  expect(readRecentColors(null)).toEqual([]);
});

test("puts new colors first, without repeats, up to the limit", () => {
  const recent = ["#111111", "#222222"];

  expect(rememberColors(recent, ["#222222", "#ABCDEF80"])).toEqual([
    "#222222",
    "#abcdef",
    "#111111",
  ]);
  const many = Array.from(
    { length: 12 },
    (_, index) => `#0000${index.toString(16).padStart(2, "0")}`,
  );
  expect(rememberColors([], many)).toHaveLength(MAX_RECENT_COLORS);
});

test("lists the colors that changed in the editor", () => {
  const after = {
    ...FALLBACK_THEME,
    ui: { ...FALLBACK_THEME.ui, accent: "#ff0000" },
    syntax: { ...FALLBACK_THEME.syntax, string: "#00ff00" },
  };

  expect(changedColors(FALLBACK_THEME, after)).toEqual(["#ff0000", "#00ff00"]);
});

test("saves recent colors next to the other settings", async () => {
  await saveSettings({ theme: "Maré", recentColors: ["#111111"] });

  await addRecentColors(["#222222"]);

  expect(await loadSettings()).toEqual({ theme: "Maré", recentColors: ["#222222", "#111111"] });
  expect(await loadRecentColors()).toEqual(["#222222", "#111111"]);
});
