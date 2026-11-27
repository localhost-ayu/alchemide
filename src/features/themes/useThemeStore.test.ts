import { beforeEach, expect, test } from "vitest";
import { saveSettings, setMockUserThemes } from "../../lib/ipc.mock";
import { userThemeSource as userTheme } from "../../test/themes";
import { findTheme, initThemes, reloadUserThemes, useThemeStore } from "./useThemeStore";

const root = document.documentElement;

beforeEach(async () => {
  setMockUserThemes({});
  await saveSettings({});
});

test("loads user themes and restores one saved by name", async () => {
  setMockUserThemes({ "noite.json": userTheme("Noite") });
  await saveSettings({ theme: "Noite" });

  await initThemes();

  const state = useThemeStore.getState();
  expect(state.userThemes.map(({ file }) => file)).toEqual(["noite.json"]);
  expect(state.theme.name).toBe("Noite");
  expect(root.dataset.theme).toBe("Noite");
  expect(findTheme("noite")?.name).toBe("Noite");
});

test("warns about broken theme files and keeps the built-in themes working", async () => {
  setMockUserThemes({ "broken.json": null });
  await saveSettings({ theme: "Maré" });

  await initThemes();

  const state = useThemeStore.getState();
  expect(state.userThemes).toEqual([]);
  expect(state.theme.name).toBe("Maré");
  expect(state.warnings).toEqual(["broken.json: the theme is not a JSON object; skipped"]);
});

test("falls back to the default theme when the saved user theme is gone", async () => {
  await saveSettings({ theme: "Noite" });

  await initThemes();

  expect(useThemeStore.getState().theme.name).toBe("Catalisador");
});

test("reloading picks up new files and the latest colors of the current theme", async () => {
  setMockUserThemes({ "noite.json": userTheme("Noite") });
  await saveSettings({ theme: "Noite" });
  await initThemes();

  setMockUserThemes({
    "noite.json": userTheme("Noite", "#000000"),
    "dia.json": userTheme("Dia"),
  });
  await reloadUserThemes();

  const state = useThemeStore.getState();
  expect(state.userThemes.map(({ theme }) => theme.name)).toEqual(["Dia", "Noite"]);
  expect(state.theme.ui.bg).toBe("#000000");
  expect(root.style.getPropertyValue("--color-bg")).toBe("#000000");
});
