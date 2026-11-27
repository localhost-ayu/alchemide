import { expect, test } from "vitest";
import { REAGENT_GREEN, terminalTheme } from "./terminalTheme";

const variables: Record<string, string> = {
  "--color-bg": "#120f1a",
  "--color-panel": "#1b1726",
  "--color-scheme": "dark",
  "--color-text": "#e9e4f5",
  "--color-accent-2": "#ff7ac6",
  "--syntax-keyword": "#ff7ac6",
  "--syntax-string": "#b6f24a",
  "--syntax-function": "#ffc857",
  "--syntax-type": "#7ad7ff",
  "--syntax-comment": "#857b9f",
};

const read = (name: string) => variables[name] ?? "";

test("maps the theme colors to the terminal palette", () => {
  const theme = terminalTheme(read, true);
  expect(theme.foreground).toBe("#e9e4f5");
  expect(theme.green).toBe("#b6f24a");
  expect(theme.yellow).toBe("#ffc857");
  expect(theme.brightBlack).toBe("#857b9f");
  expect(theme.selectionBackground).toBe("#ff7ac655");
  expect(theme.background).toBe("#1b1726");
  expect(theme.black).toBe("#120f1a");
  expect(theme.white).toBe("#e9e4f5");
});

test("uses the reagent-green cursor only with playful touches on", () => {
  expect(terminalTheme(read, true).cursor).toBe(REAGENT_GREEN);
  expect(terminalTheme(read, false).cursor).toBe("#e9e4f5");
});

test("keeps black and white readable on light themes", () => {
  const light: Record<string, string> = {
    ...variables,
    "--color-bg": "#f2faf6",
    "--color-panel": "#e2f1ea",
    "--color-text": "#23332c",
    "--color-scheme": "light",
  };
  const theme = terminalTheme((name) => light[name] ?? "", false);
  expect(theme.background).toBe("#e2f1ea");
  expect(theme.black).toBe("#23332c");
  expect(theme.white).toBe("#f2faf6");
  expect(theme.brightWhite).toBe("#f2faf6");
});

test("never uses a transparent background, which WebKitGTK paints black", () => {
  expect(terminalTheme(read, false).background).not.toMatch(/^#[0-9a-f]{6}00$/i);
});
