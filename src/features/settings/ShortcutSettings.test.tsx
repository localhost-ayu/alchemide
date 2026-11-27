import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { registerCommands, useCommandStore } from "../../lib/commands";
import { useDismiss } from "../../lib/dismiss";
import { saveSettings } from "../../lib/ipc.mock";
import { CHORD_WAIT_MS, ShortcutSettings } from "./ShortcutSettings";

let unregister = () => {};
const closed = vi.fn();

function Panel() {
  useDismiss(true, closed);
  return <ShortcutSettings />;
}

beforeEach(async () => {
  await saveSettings({});
  closed.mockReset();
  useCommandStore.setState({ overrides: {} });
  unregister = registerCommands([
    { id: "explorer", title: "Toggle explorer", keys: "Ctrl+B", run: () => {} },
    { id: "mood", title: "Choose theme", keys: "Ctrl+K M", run: () => {} },
  ]);
});

afterEach(() => {
  unregister();
  vi.useRealTimers();
});

const keysOf = (title: string) => screen.getByLabelText(`Shortcut for ${title}`).textContent;

test("records a single key after a short wait", async () => {
  vi.useFakeTimers();
  render(<Panel />);

  fireEvent.click(screen.getByRole("button", { name: "Change shortcut for Toggle explorer" }));
  expect(keysOf("Toggle explorer")).toBe("Press keys…");
  fireEvent.keyDown(window, { key: "Shift" });
  fireEvent.keyDown(window, { key: "e", ctrlKey: true, shiftKey: true });
  await act(async () => {
    vi.advanceTimersByTime(CHORD_WAIT_MS);
  });

  expect(keysOf("Toggle explorer")).toBe("Ctrl+Shift+E");
  expect(screen.getByRole("button", { name: "Reset shortcut for Toggle explorer" })).toHaveProperty(
    "disabled",
    false,
  );
});

test("records a chord when a second key follows", async () => {
  render(<Panel />);

  fireEvent.click(screen.getByRole("button", { name: "Change shortcut for Choose theme" }));
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  await act(async () => {
    fireEvent.keyDown(window, { key: "t" });
  });

  expect(keysOf("Choose theme")).toBe("Ctrl+K T");
});

test("Esc cancels the recording without closing the settings", () => {
  render(<Panel />);

  fireEvent.click(screen.getByRole("button", { name: "Change shortcut for Toggle explorer" }));
  fireEvent.keyDown(window, { key: "Escape" });

  expect(keysOf("Toggle explorer")).toBe("Ctrl+B");
  expect(closed).not.toHaveBeenCalled();
});

test("warns about conflicts and removes or resets a shortcut", async () => {
  render(<Panel />);
  act(() => useCommandStore.setState({ overrides: { mood: "Ctrl+B" } }));
  expect(screen.getAllByText(/also used by/)).toHaveLength(2);

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Remove shortcut for Toggle explorer" }));
  });
  expect(keysOf("Toggle explorer")).toBe("—");
  expect(screen.queryByText(/also used by/)).toBeNull();

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Reset shortcut for Toggle explorer" }));
  });
  expect(keysOf("Toggle explorer")).toBe("Ctrl+B");
});
