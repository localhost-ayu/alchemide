import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { TerminalPanel } from "./TerminalPanel";
import { useTerminalStore } from "./useTerminalStore";

const written: string[] = [];

vi.mock("@xterm/xterm", () => ({
  Terminal: class {
    loadAddon() {}
    open() {}
    focus() {}
    dispose() {}
    write(data: string) {
      written.push(data);
    }
    onData() {
      return { dispose() {} };
    }
    onResize() {
      return { dispose() {} };
    }
  },
}));

vi.mock("@xterm/addon-fit", () => ({
  FitAddon: class {
    fit() {}
  },
}));

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    disconnect() {}
  },
);

beforeEach(() => {
  written.length = 0;
  useTerminalStore.setState({ isOpen: false, tabs: [], activeId: null, error: null });
});

test("Ctrl+` opens the panel with a running terminal and hides it again", async () => {
  render(<TerminalPanel />);
  expect(screen.queryByRole("region", { name: "Terminal" })).toBeNull();

  await act(async () => {
    fireEvent.keyDown(window, { key: "`", ctrlKey: true });
  });

  expect(screen.getByRole("region", { name: "Terminal" })).toBeTruthy();
  expect(screen.getByRole("tab", { name: "Terminal", selected: true })).toBeTruthy();
  await vi.waitFor(() => expect(written.join("")).toContain("Mock shell"));

  await act(async () => {
    fireEvent.keyDown(window, { key: "`", ctrlKey: true });
  });
  expect(screen.queryByRole("region", { name: "Terminal" })).toBeNull();
});

test("opens a terminal for a chosen profile and closes tabs", async () => {
  render(<TerminalPanel />);
  await act(async () => {
    fireEvent.keyDown(window, { key: "`", ctrlKey: true });
  });
  const picker = await screen.findByRole("combobox", { name: "New terminal" });
  await screen.findByRole("option", { name: "WSL · Ubuntu" });

  await act(async () => {
    fireEvent.change(picker, { target: { value: "wsl:Ubuntu" } });
  });
  expect(screen.getByRole("tab", { name: "WSL · Ubuntu", selected: true })).toBeTruthy();

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Close WSL · Ubuntu" }));
  });
  expect(screen.getByRole("tab", { name: "Terminal", selected: true })).toBeTruthy();
});
