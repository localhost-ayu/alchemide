import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { DEFAULT_EDITOR_SETTINGS, useEditorSettings } from "../../lib/editorSettings";
import { loadSettings, saveSettings } from "../../lib/ipc.mock";
import { SettingsScreen } from "./SettingsScreen";

beforeEach(async () => {
  await saveSettings({});
  useEditorSettings.setState(DEFAULT_EDITOR_SETTINGS);
});

function openSettings() {
  act(() => {
    fireEvent.keyDown(window, { key: ",", ctrlKey: true });
  });
}

test("Ctrl+, opens the settings with extra sections and Escape closes them", () => {
  render(
    <SettingsScreen>
      <p>Look section</p>
    </SettingsScreen>,
  );

  openSettings();
  expect(screen.getByRole("dialog", { name: "Settings" })).toBeTruthy();
  expect(screen.getByText("Look section")).toBeTruthy();

  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("changes and saves the editor settings", async () => {
  render(<SettingsScreen />);
  openSettings();

  await act(async () => {
    fireEvent.change(screen.getByRole("combobox", { name: "Tab size" }), {
      target: { value: "4" },
    });
  });
  await act(async () => {
    fireEvent.change(screen.getByRole("spinbutton", { name: "Font size" }), {
      target: { value: "16" },
    });
  });
  const font = screen.getByRole("textbox", { name: "Font" });
  fireEvent.change(font, { target: { value: "Fira Code" } });
  await act(async () => {
    fireEvent.blur(font);
  });

  expect(await loadSettings()).toEqual({
    editor: { fontFamily: "Fira Code", fontSize: 16, tabSize: 4 },
  });
});
