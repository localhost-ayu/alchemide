import { beforeEach, expect, test } from "vitest";
import {
  DEFAULT_EDITOR_SETTINGS,
  fontStack,
  initEditorSettings,
  readEditorSettings,
  useEditorSettings,
} from "./editorSettings";
import { loadSettings, saveSettings } from "./ipc.mock";

beforeEach(async () => {
  await saveSettings({});
});

test("reads valid settings and falls back field by field", () => {
  expect(readEditorSettings({ fontFamily: " Fira Code ", fontSize: 16, tabSize: 4 })).toEqual({
    fontFamily: "Fira Code",
    fontSize: 16,
    tabSize: 4,
  });
  expect(
    readEditorSettings({ fontSize: 99, tabSize: 3, fontFamily: "x; } body { color: red" }),
  ).toEqual(DEFAULT_EDITOR_SETTINGS);
  expect(readEditorSettings(null)).toEqual(DEFAULT_EDITOR_SETTINGS);
});

test("puts the chosen font before the fallback stack", () => {
  expect(fontStack("")).toMatch(/^"Maple Mono"/);
  expect(fontStack("Fira Code")).toMatch(/^"Fira Code", "Maple Mono"/);
  expect(fontStack('"Iosevka", monospace')).toMatch(/^"Iosevka", monospace, "Maple Mono"/);
});

test("applies and saves changes, keeping the other settings", async () => {
  await saveSettings({ theme: "Maré" });

  await useEditorSettings.getState().update({ fontSize: 18 });

  expect(document.documentElement.style.getPropertyValue("--editor-font-size")).toBe("18px");
  expect(await loadSettings()).toEqual({
    theme: "Maré",
    editor: { fontFamily: "", fontSize: 18, tabSize: 2 },
  });
});

test("restores saved settings on start", async () => {
  await saveSettings({ editor: { fontFamily: "Iosevka", fontSize: 12, tabSize: 8 } });

  await initEditorSettings();

  expect(useEditorSettings.getState().tabSize).toBe(8);
  expect(document.documentElement.style.getPropertyValue("--font-code")).toMatch(/^"Iosevka"/);
});
