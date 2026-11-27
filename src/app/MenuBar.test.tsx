import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { registerCommands } from "../lib/commands";
import { saveSettings } from "../lib/ipc.mock";
import { DEFAULT_LAYOUT, useLayoutStore } from "../lib/layoutStore";
import { MenuBar } from "./MenuBar";

const ran: string[] = [];
let unregister = () => {};

beforeEach(async () => {
  ran.length = 0;
  await saveSettings({});
  useLayoutStore.setState({ ...DEFAULT_LAYOUT, zen: false });
  unregister = registerCommands([
    { id: "terminal.toggle", title: "Toggle terminal", keys: "Ctrl+`", run: () => ran.push("t") },
    { id: "editor.save", title: "Save", keys: "Ctrl+S", run: () => ran.push("s") },
  ]);
});

afterEach(() => unregister());

function tapAlt() {
  act(() => {
    fireEvent.keyDown(window, { key: "Alt", altKey: true });
    fireEvent.keyUp(window, { key: "Alt" });
  });
}

test("stays hidden until Alt is tapped, then runs a command and hides again", () => {
  render(<MenuBar />);
  expect(screen.queryByRole("menubar")).toBeNull();

  tapAlt();
  const bar = screen.getByRole("menubar", { name: "Menu bar" });
  expect(document.activeElement?.textContent).toBe("File");

  fireEvent.keyDown(document.activeElement as Element, { key: "ArrowRight" });
  expect(document.activeElement?.textContent).toBe("Terminal");
  fireEvent.keyDown(document.activeElement as Element, { key: "ArrowDown" });
  const menu = screen.getByRole("menu", { name: "Terminal" });
  expect(menu.textContent).toContain("Ctrl+`");
  fireEvent.click(screen.getByRole("menuitem", { name: /Toggle terminal/ }));

  expect(ran).toEqual(["t"]);
  expect(bar.isConnected).toBe(false);
});

test("Alt with another key is a shortcut, not a reveal", () => {
  render(<MenuBar />);
  act(() => {
    fireEvent.keyDown(window, { key: "Alt", altKey: true });
    fireEvent.keyDown(window, { key: "m", altKey: true, ctrlKey: true });
    fireEvent.keyUp(window, { key: "Alt" });
  });
  expect(screen.queryByRole("menubar")).toBeNull();
});

test("shows when the pointer reaches the top edge", () => {
  render(<MenuBar />);
  act(() => {
    window.dispatchEvent(new MouseEvent("pointermove", { clientY: 0 }));
  });
  expect(screen.getByRole("menubar")).toBeTruthy();
});

test("always mode keeps it visible and never mode ignores Alt", () => {
  useLayoutStore.setState({ menuBar: "always" });
  const { rerender } = render(<MenuBar />);
  expect(screen.getByRole("menubar")).toBeTruthy();

  act(() => useLayoutStore.setState({ menuBar: "never" }));
  rerender(<MenuBar />);
  tapAlt();
  expect(screen.queryByRole("menubar")).toBeNull();
});
