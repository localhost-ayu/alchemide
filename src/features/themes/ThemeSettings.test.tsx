import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { loadSettings, saveSettings } from "../../lib/ipc.mock";
import { ThemeSettings } from "./ThemeSettings";
import { initThemes } from "./useThemeStore";

const root = document.documentElement;

beforeEach(async () => {
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
