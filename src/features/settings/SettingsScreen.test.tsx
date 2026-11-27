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
  await act(async () => {
    fireEvent.change(screen.getByRole("combobox", { name: "Font" }), {
      target: { value: "JetBrains Mono" },
    });
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("checkbox", { name: "Ligatures" }));
  });

  expect((await loadSettings()).editor).toEqual({
    ...DEFAULT_EDITOR_SETTINGS,
    fontFamily: "JetBrains Mono",
    fontSize: 16,
    ligatures: false,
    tabSize: 4,
  });
});

test("accepts a font installed on the system", async () => {
  render(<SettingsScreen />);
  openSettings();

  fireEvent.change(screen.getByRole("combobox", { name: "Font" }), {
    target: { value: "installed" },
  });
  const font = screen.getByRole("textbox", { name: "Installed font name" });
  fireEvent.change(font, { target: { value: "Consolas" } });
  await act(async () => {
    fireEvent.blur(font);
  });

  expect(useEditorSettings.getState().fontFamily).toBe("Consolas");
});

test("Ctrl+= and Ctrl+0 zoom the interface", async () => {
  render(<SettingsScreen />);

  await act(async () => {
    fireEvent.keyDown(window, { key: "=", ctrlKey: true });
  });
  expect(useEditorSettings.getState().zoom).toBe(1.1);

  await act(async () => {
    fireEvent.keyDown(window, { key: "0", ctrlKey: true });
  });
  expect(useEditorSettings.getState().zoom).toBe(1);
});

test("searching filters the settings and says when nothing matches", () => {
  render(
    <SettingsScreen>
      <section className="settings__section">
        <h3>Terminal</h3>
        <label className="settings__field">
          <span>Cursor</span>
          <input type="checkbox" />
        </label>
      </section>
    </SettingsScreen>,
  );
  openSettings();
  const search = screen.getByRole("searchbox", { name: "Search settings" });

  fireEvent.change(search, { target: { value: "cursor" } });
  expect(screen.getByRole("checkbox", { name: "Cursor" })).toBeTruthy();
  expect(screen.queryByRole("combobox", { name: "Tab size" })).toBeNull();

  fireEvent.change(search, { target: { value: "nothing like this" } });
  expect(screen.getByText(/No setting matches/)).toBeTruthy();
});
