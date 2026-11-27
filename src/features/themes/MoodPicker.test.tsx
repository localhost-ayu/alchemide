import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { loadSettings, saveSettings, setMockUserThemes } from "../../lib/ipc.mock";
import { userThemeSource } from "../../test/themes";
import { MoodPicker } from "./MoodPicker";
import { initThemes, useThemeStore } from "./useThemeStore";

const root = document.documentElement;

beforeEach(async () => {
  setMockUserThemes({});
  await saveSettings({});
  await initThemes();
});

function openPicker() {
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  fireEvent.keyDown(window, { key: "m" });
  return screen.getByRole("combobox", { name: "Search themes and effects" });
}

test("opens with Ctrl+K M", () => {
  render(<MoodPicker />);
  expect(screen.queryByRole("dialog")).toBeNull();

  openPicker();

  expect(screen.getByRole("dialog", { name: "Choose a mood" })).toBeTruthy();
  expect(screen.getByRole("option", { name: /Catalisador/, selected: true })).toBeTruthy();
});

test("does not open with M alone", () => {
  render(<MoodPicker />);

  fireEvent.keyDown(window, { key: "m" });

  expect(screen.queryByRole("dialog")).toBeNull();
});

test("previews while navigating and restores the theme on Escape", () => {
  render(<MoodPicker />);
  const search = openPicker();

  fireEvent.keyDown(search, { key: "ArrowDown" });
  expect(root.dataset.theme).toBe("Ferrugem");

  fireEvent.keyDown(search, { key: "Escape" });
  expect(root.dataset.theme).toBe("Catalisador");
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("applies an effects preset on top of the current theme and remembers it", async () => {
  render(<MoodPicker />);
  const search = openPicker();

  fireEvent.change(search, { target: { value: "focado" } });
  await act(async () => {
    fireEvent.keyDown(search, { key: "Enter" });
  });

  expect(root.dataset.theme).toBe("Catalisador");
  expect(root.dataset.surface).toBe("solid");
  expect(root.dataset.animations).toBe("false");
  expect(await loadSettings()).toMatchObject({
    theme: "Catalisador",
    effects: { surface: "solid", background: false },
  });
});

test("restores the saved theme and effects on start", async () => {
  await saveSettings({ theme: "Maré", effects: { surface: "solid", mascot: false } });

  await initThemes();

  expect(useThemeStore.getState().theme.name).toBe("Maré");
  expect(root.dataset.theme).toBe("Maré");
  expect(root.dataset.surface).toBe("solid");
  expect(root.dataset.mascot).toBe("false");
});

test("falls back to the default theme when the saved one no longer exists", async () => {
  await saveSettings({ theme: "Removed" });

  await initThemes();

  expect(root.dataset.theme).toBe("Catalisador");
});

test("lists your themes under their own group and remembers the choice", async () => {
  setMockUserThemes({ "noite.json": userThemeSource("Noite") });
  await initThemes();
  render(<MoodPicker />);
  const search = openPicker();

  fireEvent.change(search, { target: { value: "meus temas" } });
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
    "NoiteMeus temas",
  ]);
  await act(async () => {
    fireEvent.keyDown(search, { key: "Enter" });
  });

  expect(root.dataset.theme).toBe("Noite");
  expect(await loadSettings()).toMatchObject({ theme: "Noite" });
});
