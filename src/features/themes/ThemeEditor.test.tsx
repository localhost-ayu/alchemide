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

function slide(label: string, value: number) {
  fireEvent.change(screen.getByRole("slider", { name: label }), { target: { value } });
}

test("previews glass changes and saves them with the theme", async () => {
  render(<ThemeEditor />);
  openEditor();

  slide("Panel opacity", 0.5);
  slide("Glass blur", 20);
  expect(root.style.getPropertyValue("--glass-opacity")).toBe("50%");
  expect(root.style.getPropertyValue("--glass-blur")).toBe("20px");

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Save as new theme" }));
  });
  expect(mockUserThemes()["catalisador-copy.json"]).toMatchObject({
    glass: { panelOpacity: 0.5, blur: 20 },
  });
});

test("asks for a background and a mascot before offering their sliders", () => {
  render(<ThemeEditor />);
  openEditor();

  expect(screen.queryByRole("slider", { name: "Background dim" })).toBeNull();
  expect(screen.queryByRole("slider", { name: "Mascot size" })).toBeNull();
  expect(screen.getByText(/Choose a background image/)).toBeTruthy();
});

test("adjusts your own background and mascot live and keeps them in the settings", async () => {
  await saveSettings({
    background: { type: "image", path: "backgrounds/sample-lab.svg", dim: 0.55 },
    mascot: { path: "mascots/sample-flask.svg" },
  });
  await initThemes();
  render(<ThemeEditor />);
  openEditor();

  slide("Background dim", 0.2);
  slide("Mascot size", 120);
  fireEvent.change(screen.getByRole("combobox", { name: "Corner" }), {
    target: { value: "top-left" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Fit" }), {
    target: { value: "contain" },
  });
  expect(root.style.getPropertyValue("--backdrop-dim")).toBe("20%");
  expect(root.style.getPropertyValue("--mascot-size")).toBe("120px");
  expect(root.dataset.mascotCorner).toBe("top-left");
  expect(root.dataset.backdropFit).toBe("contain");

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Save as new theme" }));
  });

  expect(await loadSettings()).toMatchObject({
    theme: "Catalisador copy",
    background: { path: "backgrounds/sample-lab.svg", dim: 0.2, fit: "contain" },
    mascot: { path: "mascots/sample-flask.svg", size: 120, corner: "top-left" },
  });
  expect(root.style.getPropertyValue("--mascot-size")).toBe("120px");
});

test("turns glass panels off with a live preview, undone by cancel and kept by save", async () => {
  render(<ThemeEditor />);
  openEditor();
  const glass = () => screen.getByRole("checkbox", { name: "Glass panels" });
  expect(glass()).toHaveProperty("checked", true);

  fireEvent.click(glass());
  expect(root.dataset.surface).toBe("solid");
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(root.dataset.surface).toBe("glass");

  openEditor();
  fireEvent.click(glass());
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Save as new theme" }));
  });
  expect(root.dataset.surface).toBe("solid");
  expect(await loadSettings()).toMatchObject({ effects: { surface: "solid" } });
  expect(mockUserThemes()["catalisador-copy.json"]).toMatchObject({
    effects: { surface: "solid" },
  });
});

test("chooses what sits behind open files and tunes the layer", async () => {
  await saveSettings({
    background: { type: "image", path: "backgrounds/sample-lab.svg", dim: 0.55 },
  });
  await initThemes();
  render(<ThemeEditor />);
  openEditor();

  const mode = screen.getByRole("combobox", { name: "Behind open files" });
  expect((mode as HTMLSelectElement).value).toBe("layer");
  expect(root.dataset.editorBackdrop).toBe("layer");
  slide("Layer dim", 0.4);
  slide("Layer blur", 18);
  expect(root.style.getPropertyValue("--layer-dim")).toBe("40%");
  expect(root.style.getPropertyValue("--layer-blur")).toBe("18px");

  fireEvent.change(mode, { target: { value: "sharp" } });
  expect(root.dataset.editorBackdrop).toBe("sharp");
  expect(screen.queryByRole("slider", { name: "Layer dim" })).toBeNull();

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Save as new theme" }));
  });
  expect(await loadSettings()).toMatchObject({
    background: { editor: { mode: "sharp", dim: 0.4, blur: 18 } },
  });
});

test("cancel also restores your background and mascot", async () => {
  await saveSettings({ mascot: { path: "mascots/sample-flask.svg", size: 280 } });
  await initThemes();
  render(<ThemeEditor />);
  openEditor();

  slide("Mascot size", 64);
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

  expect(root.style.getPropertyValue("--mascot-size")).toBe("280px");
  expect(useThemeStore.getState().custom.mascot?.size).toBe(280);
});

test("starts from a built-in theme's colors without losing the name", () => {
  render(<ThemeEditor />);
  openEditor();

  fireEvent.click(screen.getByRole("button", { name: "Aço" }));

  expect(root.style.getPropertyValue("--color-bg")).toBe("#11151a");
  expect(screen.getByRole("textbox", { name: "Name" })).toHaveProperty("value", "Catalisador copy");
});

test("changes corners and the interface font live and saves them", async () => {
  render(<ThemeEditor />);
  openEditor();

  fireEvent.click(screen.getByRole("button", { name: "Round" }));
  fireEvent.click(screen.getByRole("radio", { name: /Editorial/ }));
  expect(root.style.getPropertyValue("--radius")).toBe("14px");
  expect(root.style.getPropertyValue("--font-ui")).toMatch(/serif/);

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Save as new theme" }));
  });
  expect(mockUserThemes()["catalisador-copy.json"]).toMatchObject({
    shape: { radius: 14, font: "serif" },
  });
});

test("suggests a panel opacity that keeps text readable over a background image", async () => {
  await saveSettings({ background: { type: "image", path: "backgrounds/sample-lab.svg", dim: 0 } });
  await initThemes();
  render(<ThemeEditor />);
  openEditor();
  slide("Panel opacity", 0.3);

  const suggestion = screen.getByText(/hard to read/);
  const apply = screen.getByRole("button", { name: /^Use \d+%$/ });
  const percent = Number(apply.textContent?.match(/\d+/)?.[0]);
  expect(suggestion.textContent).toContain(`${percent}%`);

  fireEvent.click(apply);

  expect(root.style.getPropertyValue("--glass-opacity")).toBe(`${percent}%`);
  expect(screen.queryByText(/hard to read/)).toBeNull();
});

test("offers recent colors in every color picker and remembers the ones you saved", async () => {
  await saveSettings({ recentColors: ["#123456"] });
  render(<ThemeEditor />);
  await act(async () => {
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    fireEvent.keyDown(window, { key: "e" });
  });
  expect(screen.getByRole("complementary", { name: "Theme editor" })).toBeTruthy();

  const suggestions = [...document.querySelectorAll("#theme-editor-colors option")].map(
    (option) => (option as HTMLOptionElement).value,
  );
  expect(suggestions[0]).toBe("#123456");
  expect(screen.getByLabelText("Keywords").getAttribute("list")).toBe("theme-editor-colors");

  pick("Keywords", "#ff0000");
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Save as new theme" }));
  });

  expect((await loadSettings()).recentColors).toEqual(["#ff0000", "#123456"]);
});

test("undo brings back the theme without closing, and defaults applies the default look", () => {
  render(<ThemeEditor />);
  openEditor();
  pick("Background", "#000000");
  fireEvent.click(screen.getByRole("button", { name: "Round" }));

  fireEvent.click(screen.getByRole("button", { name: "Undo changes" }));
  expect(root.style.getPropertyValue("--color-bg")).toBe("#120f1a");
  expect(root.style.getPropertyValue("--radius")).toBe("8px");
  expect(screen.getByRole("textbox", { name: "Name" })).toHaveProperty("value", "Catalisador copy");

  pick("Background", "#000000");
  fireEvent.click(screen.getByRole("button", { name: "Defaults" }));
  expect(root.style.getPropertyValue("--color-bg")).toBe("#120f1a");
  expect(screen.getByRole("complementary", { name: "Theme editor" })).toBeTruthy();
});
