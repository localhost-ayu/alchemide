import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  loadSettings,
  mockExportedThemes,
  mockUserThemes,
  saveSettings,
  setMockThemeToImport,
  setMockUserThemes,
} from "../../lib/ipc.mock";
import { userThemeSource } from "../../test/themes";
import {
  deleteCurrentTheme,
  duplicateCurrentTheme,
  exportCurrentTheme,
  importThemeFile,
} from "./themeLibrary";
import { initThemes, useThemeStore } from "./useThemeStore";

const root = document.documentElement;

beforeEach(async () => {
  setMockUserThemes({});
  setMockThemeToImport(null);
  await saveSettings({});
  await initThemes();
});

afterEach(() => vi.restoreAllMocks());

function themeNames(): string[] {
  return useThemeStore.getState().userThemes.map(({ theme }) => theme.name);
}

test("duplicates the current theme into a new user theme and switches to it", async () => {
  await duplicateCurrentTheme();
  await duplicateCurrentTheme();

  expect(themeNames().sort()).toEqual(["Catalisador copy", "Catalisador copy copy"]);
  expect(root.dataset.theme).toBe("Catalisador copy copy");
  expect(Object.keys(mockUserThemes()).sort()).toEqual([
    "catalisador-copy-copy.json",
    "catalisador-copy.json",
  ]);
  expect(await loadSettings()).toMatchObject({ theme: "Catalisador copy copy" });
});

test("imports a valid theme and selects it", async () => {
  setMockThemeToImport(userThemeSource("Noite"));

  await importThemeFile();

  expect(themeNames()).toEqual(["Noite"]);
  expect(root.dataset.theme).toBe("Noite");
  expect(useThemeStore.getState().warnings).toEqual([]);
});

test("renames an imported theme whose name is taken and says so", async () => {
  setMockThemeToImport(userThemeSource("Maré"));

  await importThemeFile();

  expect(themeNames()).toEqual(["Maré 2"]);
  expect(useThemeStore.getState().warnings).toEqual([
    '"Maré" already exists; imported as "Maré 2"',
  ]);
});

test("refuses an invalid theme without saving anything", async () => {
  setMockThemeToImport({ name: "Sem cores" });

  await importThemeFile();

  expect(mockUserThemes()).toEqual({});
  expect(root.dataset.theme).toBe("Catalisador");
  expect(useThemeStore.getState().warnings[0]).toMatch(
    /^could not import the theme: Sem cores: ui/,
  );
});

test("does nothing when the import dialog is cancelled", async () => {
  await importThemeFile();

  expect(mockUserThemes()).toEqual({});
  expect(useThemeStore.getState().warnings).toEqual([]);
});

test("exports the current theme", async () => {
  await exportCurrentTheme();

  expect(mockExportedThemes().pop()).toMatchObject({ name: "Catalisador", ui: { bg: "#120f1a" } });
});

test("deletes the current user theme after confirming and falls back to the default", async () => {
  setMockUserThemes({ "noite.json": userThemeSource("Noite") });
  await saveSettings({ theme: "Noite" });
  await initThemes();
  vi.spyOn(window, "confirm").mockReturnValue(true);

  await deleteCurrentTheme();

  expect(mockUserThemes()).toEqual({});
  expect(themeNames()).toEqual([]);
  expect(root.dataset.theme).toBe("Catalisador");
  expect(await loadSettings()).toMatchObject({ theme: "Catalisador" });
});

test("keeps the theme when the deletion is not confirmed", async () => {
  setMockUserThemes({ "noite.json": userThemeSource("Noite") });
  await saveSettings({ theme: "Noite" });
  await initThemes();
  vi.spyOn(window, "confirm").mockReturnValue(false);

  await deleteCurrentTheme();

  expect(Object.keys(mockUserThemes())).toEqual(["noite.json"]);
  expect(root.dataset.theme).toBe("Noite");
});

test("never deletes a built-in theme", async () => {
  const confirm = vi.spyOn(window, "confirm");

  await deleteCurrentTheme();

  expect(confirm).not.toHaveBeenCalled();
  expect(useThemeStore.getState().warnings).toEqual(["built-in themes cannot be deleted"]);
});
