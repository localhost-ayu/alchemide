import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { TerminalPanel } from "./TerminalPanel";
import { DEFAULT_TERMINAL_SETTINGS, useTerminalSettings } from "./useTerminalSettings";
import { useTerminalStore } from "./useTerminalStore";

const written: string[] = [];
const terminals: { options: Record<string, unknown>; bell: () => void }[] = [];

vi.mock("@xterm/xterm", () => ({
  Terminal: class {
    options: Record<string, unknown>;
    bell: () => void = () => {};
    constructor(options: Record<string, unknown>) {
      this.options = { ...options };
      terminals.push(this);
    }
    onBell(handler: () => void) {
      this.bell = handler;
      return { dispose() {} };
    }
    loadAddon() {}
    attachCustomKeyEventHandler() {}
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
  terminals.length = 0;
  useTerminalSettings.setState(DEFAULT_TERMINAL_SETTINGS);
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

test("creates terminals with your settings and applies changes live", async () => {
  useTerminalSettings.setState({ cursorStyle: "bar", scrollback: 20000, palette: "Paper" });
  render(<TerminalPanel />);
  await act(async () => {
    fireEvent.keyDown(window, { key: "`", ctrlKey: true });
  });
  const created = terminals[0];
  expect(created?.options).toMatchObject({ cursorStyle: "bar", scrollback: 20000 });
  expect(created?.options.theme).toMatchObject({ background: "#faf7f0" });

  await act(async () => {
    await useTerminalSettings.getState().update({ cursorStyle: "underline", palette: "theme" });
  });

  expect(created?.options.cursorStyle).toBe("underline");
  expect(created?.options.theme).not.toMatchObject({ background: "#faf7f0" });
});

test("flashes the terminal on bell unless turned off", async () => {
  const { container } = render(<TerminalPanel />);
  await act(async () => {
    fireEvent.keyDown(window, { key: "`", ctrlKey: true });
  });
  const view = container.querySelector(".terminal-view") as HTMLElement;

  act(() => terminals[0]?.bell());
  expect(view.dataset.bell).toBe("true");

  delete view.dataset.bell;
  useTerminalSettings.setState({ visualBell: false });
  act(() => terminals[0]?.bell());
  expect(view.dataset.bell).toBeUndefined();
});
