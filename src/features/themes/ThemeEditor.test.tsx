import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { loadSettings, mockUserThemes, saveSettings, setMockUserThemes } from "../../lib/ipc.mock";
import { userThemeSource } from "../../test/themes";
import { ThemeEditor } from "./ThemeEditor";
import { initThemes, useThemeStore } from "./useThemeStore";

const root = document.documentElement;

beforeEach(async () => {
  setMockUserThemes({});
  await saveSettings({});
  await initThemes();
});

function openEditor() {
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  fireEvent.keyDown(window, { key: "e" });
  return screen.getByRole("complementary", { name: "Theme editor" });
}

function pick(label: string, color: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value: color } });
}

test("opens with Ctrl+K E and previews color changes live", () => {
  render(<ThemeEditor />);

  openEditor();
  pick("Background", "#000000");
  pick("Keywords", "#ff0000");

  expect(root.style.getPropertyValue("--color-bg")).toBe("#000000");
  expect(root.style.getPropertyValue("--syntax-keyword")).toBe("#ff0000");
});

test("cancel restores the theme as it was", () => {
  render(<ThemeEditor />);
  openEditor();
  pick("Background", "#000000");

  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

  expect(root.style.getPropertyValue("--color-bg")).toBe("#120f1a");
  expect(root.dataset.theme).toBe("Catalisador");
  expect(screen.queryByRole("complementary", { name: "Theme editor" })).toBeNull();
});

test("Escape also cancels", () => {
  render(<ThemeEditor />);
  const editor = openEditor();
  pick("Background", "#000000");

  fireEvent.keyDown(editor, { key: "Escape" });

  expect(root.style.getPropertyValue("--color-bg")).toBe("#120f1a");
});

test("saves an edited built-in theme as a new theme of yours", async () => {
  render(<ThemeEditor />);
  openEditor();
  expect(screen.getByRole("textbox", { name: "Name" })).toHaveProperty("value", "Catalisador copy");
  pick("Strings", "#00ff00");

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Save as new theme" }));
  });

  expect(mockUserThemes()["catalisador-copy.json"]).toMatchObject({
    name: "Catalisador copy",
    syntax: { string: "#00ff00" },
  });
  expect(useThemeStore.getState().theme.name).toBe("Catalisador copy");
  expect(await loadSettings()).toMatchObject({ theme: "Catalisador copy" });
});

test("saves your own theme in place, renamed if you want", async () => {
  setMockUserThemes({ "noite.json": userThemeSource("Noite") });
  await saveSettings({ theme: "Noite" });
  await initThemes();
  render(<ThemeEditor />);
  openEditor();

  fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
    target: { value: "Noite funda" },
  });
  pick("Background", "#000000");
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
  });

  expect(Object.keys(mockUserThemes())).toEqual(["noite.json"]);
  expect(mockUserThemes()["noite.json"]).toMatchObject({
    name: "Noite funda",
    ui: { bg: "#000000" },
  });
  expect(root.dataset.theme).toBe("Noite funda");
});

test("blocks saving with an empty or taken name", () => {
  render(<ThemeEditor />);
  openEditor();
  const name = screen.getByRole("textbox", { name: "Name" });
  const save = screen.getByRole("button", { name: "Save as new theme" });

  fireEvent.change(name, { target: { value: "maré" } });
  expect(screen.getByRole("alert").textContent).toBe("Another theme already has this name");
  expect(save).toHaveProperty("disabled", true);

  fireEvent.change(name, { target: { value: " " } });
  expect(screen.getByRole("alert").textContent).toBe("Give the theme a name");
});

test("flags syntax colors below the AA contrast on the background", () => {
  render(<ThemeEditor />);
  openEditor();

  pick("Comments", "#14111d");

  const comments = screen.getByLabelText("Comments").closest("label");
  expect(comments?.querySelector("[data-low='true']")).not.toBeNull();
  expect(
    screen.getByLabelText("Strings").closest("label")?.querySelector("[data-low='true']"),
  ).toBeNull();
});
