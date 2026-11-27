import { expect, test } from "vitest";
import { userThemeSource } from "../../test/themes";
import { BUILTIN_THEMES } from "./builtinThemes";
import { nameProblem, readUserThemes, uniqueName } from "./userThemes";

const { ui, syntax } = userThemeSource("unused");
const colors = { ui, syntax };

test("loads valid user themes in file order", () => {
  const { themes, warnings } = readUserThemes(
    [
      { file: "a.json", theme: { name: "Noite", ...colors } },
      { file: "b.json", theme: { name: "Dia", ...colors } },
    ],
    BUILTIN_THEMES,
  );

  expect(themes.map(({ file, theme }) => [file, theme.name])).toEqual([
    ["a.json", "Noite"],
    ["b.json", "Dia"],
  ]);
  expect(themes[0]?.theme.syntax.type).toBe("#f0a0f0");
  expect(warnings).toEqual([]);
});

test("skips broken files with a warning instead of falling back", () => {
  const { themes, warnings } = readUserThemes(
    [
      { file: "broken.json", theme: null },
      { file: "no-ui.json", theme: { name: "Sem UI", syntax: colors.syntax } },
    ],
    BUILTIN_THEMES,
  );

  expect(themes).toEqual([]);
  expect(warnings).toEqual([
    "broken.json: the theme is not a JSON object; skipped",
    "no-ui.json: Sem UI: ui needs hex colors for bg, panel, accent, accent2, text; skipped",
  ]);
});

test("skips themes whose name is already taken, ignoring case", () => {
  const { themes, warnings } = readUserThemes(
    [
      { file: "copy.json", theme: { name: "catalisador", ...colors } },
      { file: "a.json", theme: { name: "Noite", ...colors } },
      { file: "b.json", theme: { name: " noite ", ...colors } },
    ],
    BUILTIN_THEMES,
  );

  expect(themes.map(({ file }) => file)).toEqual(["a.json"]);
  expect(warnings).toEqual([
    'copy.json: the name "catalisador" is already in use; skipped',
    'b.json: the name " noite " is already in use; skipped',
  ]);
});

test("keeps a theme with invalid optional fields and reports them", () => {
  const { themes, warnings } = readUserThemes(
    [{ file: "a.json", theme: { name: "Noite", ...colors, mascot: { path: "../x.png" } } }],
    BUILTIN_THEMES,
  );

  expect(themes[0]?.theme.mascot).toBeNull();
  expect(warnings).toEqual(["a.json: mascot is invalid; hiding it"]);
});

test("numbers a name until it is free, ignoring case", () => {
  expect(uniqueName("Noite", ["Dia"])).toBe("Noite");
  expect(uniqueName(" Noite ", ["noite"])).toBe("Noite 2");
  expect(uniqueName("Noite", ["Noite", "noite 2", "Noite 3"])).toBe("Noite 4");
});

test("explains why a name cannot be used", () => {
  expect(nameProblem("Noite", ["Dia"])).toBeNull();
  expect(nameProblem("  ", [])).toBe("Give the theme a name");
  expect(nameProblem(" maré", ["Maré"])).toBe("Another theme already has this name");
});
