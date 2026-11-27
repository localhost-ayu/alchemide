import { expect, test } from "vitest";
import { buildMenus, menuOf } from "./menus";

const run = () => undefined;

test("puts each command in a menu by its id", () => {
  expect(menuOf("themes.pickMood")).toBe("Theme");
  expect(menuOf("terminal.new")).toBe("Terminal");
  expect(menuOf("view.toggleZen")).toBe("View");
  expect(menuOf("unknown.thing")).toBe("More");
});

test("builds the menus in a fixed order, items sorted, with the effective shortcuts", () => {
  const menus = buildMenus(
    [
      { id: "terminal.toggle", title: "Toggle terminal", keys: "Ctrl+`", run },
      { id: "editor.save", title: "Save", keys: "Ctrl+S", run },
      { id: "explorer.openFolder", title: "Open folder", keys: "Ctrl+K Ctrl+O", run },
      { id: "custom.x", title: "Something", run },
    ],
    { "terminal.toggle": "Ctrl+J", "editor.save": null },
  );

  expect(menus.map((menu) => menu.label)).toEqual(["File", "Terminal", "More"]);
  expect(menus[0]?.items).toEqual([
    { id: "explorer.openFolder", title: "Open folder", keys: "Ctrl+K Ctrl+O" },
    { id: "editor.save", title: "Save", keys: undefined },
  ]);
  expect(menus[1]?.items[0]?.keys).toBe("Ctrl+J");
});
