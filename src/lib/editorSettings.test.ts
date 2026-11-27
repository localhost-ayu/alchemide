import { beforeEach, expect, test } from "vitest";
import {
  DEFAULT_EDITOR_SETTINGS,
  fontStack,
  initEditorSettings,
  nextZoom,
  readEditorSettings,
  useEditorSettings,
} from "./editorSettings";
import { loadSettings, mockZoom, saveSettings } from "./ipc.mock";

beforeEach(async () => {
  await saveSettings({});
  useEditorSettings.setState(DEFAULT_EDITOR_SETTINGS);
});

test("reads valid settings and falls back field by field", () => {
  expect(
    readEditorSettings({
      fontFamily: " Fira Code ",
      fontSize: 16,
      terminalFontSize: 12,
      lineHeight: 1.8,
      ligatures: false,
      zoom: 1.25,
      tabSize: 4,
      inlineBlame: false,
    }),
  ).toEqual({
    fontFamily: "Fira Code",
    fontSize: 16,
    terminalFontSize: 12,
    lineHeight: 1.8,
    ligatures: false,
    zoom: 1.25,
    tabSize: 4,
    inlineBlame: false,
  });
  expect(
    readEditorSettings({
      fontSize: 99,
      terminalFontSize: 2,
      lineHeight: 5,
      ligatures: "yes",
      zoom: 9,
      tabSize: 3,
      inlineBlame: "no",
      fontFamily: "x; } body { color: red",
    }),
  ).toEqual(DEFAULT_EDITOR_SETTINGS);
  expect(readEditorSettings(null)).toEqual(DEFAULT_EDITOR_SETTINGS);
});

test("uses the bundled Maple Mono when no font is chosen", () => {
  expect(readEditorSettings({ fontFamily: "  " }).fontFamily).toBe("Maple Mono");
});

test("puts the chosen font before the fallback stack", () => {
  expect(fontStack("Fira Code")).toMatch(/^"Fira Code", "Cascadia Code"/);
  expect(fontStack('"Iosevka", monospace')).toMatch(/^"Iosevka", monospace, "Cascadia Code"/);
});

test("steps the zoom through fixed levels", () => {
  expect(nextZoom(1, 1)).toBe(1.1);
  expect(nextZoom(1, -1)).toBe(0.9);
  expect(nextZoom(1.5, 1)).toBe(1.5);
  expect(nextZoom(0.75, -1)).toBe(0.75);
  expect(nextZoom(1.2, 1)).toBe(1.25);
});

test("applies and saves changes, keeping the other settings", async () => {
  await saveSettings({ theme: "Maré" });

  await useEditorSettings.getState().update({ fontSize: 18, lineHeight: 1.4, ligatures: false });

  const style = document.documentElement.style;
  expect(style.getPropertyValue("--editor-font-size")).toBe("18px");
  expect(style.getPropertyValue("--editor-line-height")).toBe("1.4");
  expect(style.getPropertyValue("--code-ligatures")).toBe("none");
  expect(await loadSettings()).toEqual({
    theme: "Maré",
    editor: { ...DEFAULT_EDITOR_SETTINGS, fontSize: 18, lineHeight: 1.4, ligatures: false },
  });
});

test("zooms the window through the backend", async () => {
  await useEditorSettings.getState().update({ zoom: 1.25 });
  expect(mockZoom()).toBe(1.25);

  await useEditorSettings.getState().update({ zoom: 1 });
  expect(mockZoom()).toBe(1);
});

test("restores saved settings on start", async () => {
  await saveSettings({ editor: { fontFamily: "Iosevka", fontSize: 12, tabSize: 8 } });

  await initEditorSettings();

  expect(useEditorSettings.getState().tabSize).toBe(8);
  expect(document.documentElement.style.getPropertyValue("--font-code")).toMatch(/^"Iosevka"/);
});

test("changing one setting keeps the inline blame choice", async () => {
  await useEditorSettings.getState().update({ inlineBlame: false });
  await useEditorSettings.getState().update({ fontSize: 15 });
  expect(useEditorSettings.getState().inlineBlame).toBe(false);
  await useEditorSettings.getState().update({ inlineBlame: true });
});
