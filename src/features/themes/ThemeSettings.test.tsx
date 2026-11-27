import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { loadSettings, saveSettings, setMockUserThemes } from "../../lib/ipc.mock";
import { userThemeSource } from "../../test/themes";
import { ThemeSettings } from "./ThemeSettings";
import { initThemes } from "./useThemeStore";

const root = document.documentElement;

beforeEach(async () => {
  setMockUserThemes({});
  await saveSettings({});
  await initThemes();
});

test("switches the theme and each effect", async () => {
  render(<ThemeSettings />);

  await act(async () => {
    fireEvent.change(screen.getByRole("combobox", { name: "Theme" }), {
      target: { value: "Maré" },
    });
  });
  expect(root.dataset.theme).toBe("Maré");

  await act(async () => {
    fireEvent.click(screen.getByRole("checkbox", { name: "Glass panels" }));
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("checkbox", { name: "Animations" }));
  });

  expect(root.dataset.surface).toBe("solid");
  expect(root.dataset.animations).toBe("false");
  expect(await loadSettings()).toMatchObject({
    theme: "Maré",
    effects: { surface: "solid", animations: false, background: true },
  });
});

test("offers your themes after the built-in ones", async () => {
  setMockUserThemes({ "noite.json": userThemeSource("Noite") });
  await initThemes();
  render(<ThemeSettings />);

  const select = screen.getByRole("combobox", { name: "Theme" });
  expect(screen.getByRole("group", { name: "Your themes" })).toBeTruthy();
  await act(async () => {
    fireEvent.change(select, { target: { value: "Noite" } });
  });

  expect(root.dataset.theme).toBe("Noite");
});

test("duplicates the theme from the settings and only lets you delete your own", async () => {
  render(<ThemeSettings />);
  const remove = screen.getByRole("button", { name: "Delete" });
  expect((remove as HTMLButtonElement).disabled).toBe(true);

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
  });

  const select = screen.getByRole("combobox", { name: "Theme" }) as HTMLSelectElement;
  expect(select.value).toBe("Catalisador copy");
  expect((remove as HTMLButtonElement).disabled).toBe(false);
});
