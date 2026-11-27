import { expect, test } from "vitest";
import { readTheme } from "./parseTheme";
import { colorForScope, fromVscodeTheme, isDarkTheme } from "./vscodeTheme";

const darkPlus = {
  name: "Dark+",
  type: "dark",
  colors: {
    "editor.background": "#1E1E1E",
    "editor.foreground": "#D4D4D4",
    "sideBar.background": "#252526",
    focusBorder: "#007FD4",
    "activityBarBadge.background": "#007FD4cc",
  },
  tokenColors: [
    { settings: { foreground: "#D4D4D4" } },
    { scope: "comment", settings: { foreground: "#6A9955" } },
    { scope: ["string", "string.tag"], settings: { foreground: "#CE9178" } },
    { scope: "keyword", settings: { foreground: "#569CD6" } },
    { scope: "keyword.control", settings: { foreground: "#C586C0" } },
    { scope: "keyword.operator", settings: { foreground: "#D4D4D4" } },
    { scope: "entity.name.function, support.function", settings: { foreground: "#DCDCAA" } },
    { scope: ["entity.name.type", "support.type"], settings: { foreground: "#4EC9B0" } },
    { scope: "variable", settings: { foreground: "#9CDCFE" } },
    { scope: "constant.numeric", settings: { foreground: "#B5CEA8" } },
    { scope: "source.php variable", settings: { foreground: "#FFFFFF" } },
  ],
};

test("maps a VS Code theme to a valid Alchemide theme", () => {
  const { theme, warnings } = readTheme(fromVscodeTheme(darkPlus, "fallback"));

  expect(warnings).toEqual([]);
  expect(theme?.name).toBe("Dark+");
  expect(theme?.ui).toEqual({
    bg: "#1E1E1E",
    panel: "#252526",
    accent: "#007FD4",
    accent2: "#C586C0",
    text: "#D4D4D4",
  });
  expect(theme?.syntax).toEqual({
    keyword: "#C586C0",
    string: "#CE9178",
    function: "#DCDCAA",
    comment: "#6A9955",
    variable: "#9CDCFE",
    type: "#4EC9B0",
    number: "#B5CEA8",
  });
  expect(theme?.background).toEqual({ type: "solid", color: "#1E1E1E" });
  expect(theme?.effects.surface).toBe("solid");
});

test("prefers the most specific scope and the later rule on ties", () => {
  const rules = [
    { scopes: ["keyword"], foreground: "#111111" },
    { scopes: ["keyword.control"], foreground: "#222222" },
    { scopes: ["keyword.control"], foreground: "#333333" },
    { scopes: ["keyword.controlflow"], foreground: "#444444" },
  ];
  expect(colorForScope(rules, "keyword.control.php")).toBe("#333333");
  expect(colorForScope(rules, "keyword.other")).toBe("#111111");
  expect(colorForScope(rules, "string")).toBeNull();
});

test("fills missing colors from the text color and the theme type", () => {
  const theme = fromVscodeTheme({ type: "light", colors: {}, tokenColors: [] }, "Plain");
  const { theme: parsed } = readTheme(theme);

  expect(parsed?.name).toBe("Plain");
  expect(parsed?.ui.text).toBe("#333333");
  expect(parsed?.syntax.keyword).toBe("#333333");
});

test("guesses dark or light from the background when the type is missing", () => {
  expect(isDarkTheme({}, "#fdf6e3")).toBe(false);
  expect(isDarkTheme({}, "#002b36")).toBe(true);
  expect(isDarkTheme({}, "#fff")).toBe(false);
});
