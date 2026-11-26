import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { registerCommands } from "../../lib/commands";
import { CommandPalette } from "./CommandPalette";

const ran: string[] = [];
let unregister = () => {};

beforeEach(() => {
  ran.length = 0;
  unregister = registerCommands([
    { id: "a", title: "Toggle terminal", keys: "Ctrl+`", run: () => ran.push("terminal") },
    { id: "b", title: "Toggle explorer", keys: "Ctrl+B", run: () => ran.push("explorer") },
    { id: "c", title: "Save file", keys: "Ctrl+S", run: () => ran.push("save") },
  ]);
});

afterEach(() => unregister());

function openPalette() {
  fireEvent.keyDown(window, { key: "P", ctrlKey: true, shiftKey: true });
  return screen.getByRole("combobox", { name: "Run a command" });
}

test("Ctrl+Shift+P lists every registered command with its shortcut", () => {
  render(<CommandPalette />);

  openPalette();

  const options = screen.getAllByRole("option").map((option) => option.textContent);
  expect(options).toEqual(["Save fileCtrl+S", "Toggle explorerCtrl+B", "Toggle terminalCtrl+`"]);
});

test("filters with fuzzy matching and runs the chosen command", () => {
  render(<CommandPalette />);
  const search = openPalette();

  fireEvent.change(search, { target: { value: "tgl term" } });
  fireEvent.keyDown(search, { key: "Enter" });

  expect(ran).toEqual(["terminal"]);
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("navigates with the arrow keys and closes with Escape", () => {
  render(<CommandPalette />);
  const search = openPalette();

  fireEvent.keyDown(search, { key: "ArrowDown" });
  expect(screen.getByRole("option", { selected: true }).textContent).toContain("Toggle explorer");

  fireEvent.keyDown(search, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(ran).toEqual([]);
});
