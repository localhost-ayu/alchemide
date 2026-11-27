import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { runCommand } from "../../lib/commands";
import { saveSettings, setMockUserThemes } from "../../lib/ipc.mock";
import { initThemes, useThemeStore } from "./useThemeStore";
import { VscodeThemePicker } from "./VscodeThemePicker";

beforeEach(async () => {
  setMockUserThemes({});
  await saveSettings({});
  await initThemes();
});

async function openPicker() {
  await act(async () => runCommand("themes.importVscode"));
  return screen.getByRole("combobox", { name: "Search VS Code themes" });
}

test("lists installed VS Code themes and filters them", async () => {
  render(<VscodeThemePicker />);
  const search = await openPicker();

  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
    "Dark Moderndark · theme-defaults",
    "Solarized Lightlight · theme-solarized-light",
  ]);

  fireEvent.change(search, { target: { value: "solar" } });
  expect(screen.getAllByRole("option")).toHaveLength(1);
});

test("imports the chosen theme with Enter and closes", async () => {
  render(<VscodeThemePicker />);
  const search = await openPicker();

  fireEvent.keyDown(search, { key: "ArrowDown" });
  await act(async () => {
    fireEvent.keyDown(search, { key: "Enter" });
  });

  expect(screen.queryByRole("dialog")).toBeNull();
  await vi.waitFor(() => expect(useThemeStore.getState().theme.name).toBe("Solarized Light"));
});

test("closes on Escape without importing", async () => {
  render(<VscodeThemePicker />);
  const search = await openPicker();

  fireEvent.keyDown(search, { key: "Escape" });

  expect(screen.queryByRole("dialog")).toBeNull();
  expect(useThemeStore.getState().userThemes).toEqual([]);
});
