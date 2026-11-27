import { beforeEach, expect, test } from "vitest";
import { useCommandStore } from "./commands";
import { loadSettings, saveSettings } from "./ipc.mock";
import {
  initKeybindings,
  isValidKeys,
  readOverrides,
  resetShortcut,
  setShortcut,
} from "./keybindings";

beforeEach(async () => {
  await saveSettings({});
  useCommandStore.setState({ overrides: {} });
});

test("accepts single keys and two-step chords", () => {
  for (const keys of [
    "Ctrl+B",
    "Ctrl+Shift+P",
    "F12",
    "Ctrl+K M",
    "Ctrl+K Ctrl+O",
    "Ctrl+`",
    "Ctrl+=",
  ]) {
    expect(isValidKeys(keys), keys).toBe(true);
  }
  for (const keys of ["", "Ctrl+", "a b c", "Ctrl+K  M", " Ctrl+B"]) {
    expect(isValidKeys(keys), keys).toBe(false);
  }
});

test("reads saved shortcuts and drops invalid ones", () => {
  expect(readOverrides({ a: "Ctrl+J", b: null, c: "not a  shortcut", d: 3 })).toEqual({
    a: "Ctrl+J",
    b: null,
  });
  expect(readOverrides(["Ctrl+J"])).toEqual({});
});

test("saves, resets and restores shortcuts", async () => {
  await setShortcut("view.toggleExplorer", "Ctrl+Shift+E");
  await setShortcut("terminal.toggle", null);
  expect(await loadSettings()).toEqual({
    keybindings: { "view.toggleExplorer": "Ctrl+Shift+E", "terminal.toggle": null },
  });

  await resetShortcut("terminal.toggle");
  useCommandStore.setState({ overrides: {} });
  await initKeybindings();

  expect(useCommandStore.getState().overrides).toEqual({ "view.toggleExplorer": "Ctrl+Shift+E" });
});
