import { expect, test } from "vitest";
import { REAGENT_GREEN, terminalTheme } from "./terminalTheme";

const variables: Record<string, string> = {
  "--color-bg": "#120f1a",
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
  expect(theme.background).toBe("#00000000");
});

test("uses the reagent-green cursor only with playful touches on", () => {
  expect(terminalTheme(read, true).cursor).toBe(REAGENT_GREEN);
  expect(terminalTheme(read, false).cursor).toBe("#e9e4f5");
});
