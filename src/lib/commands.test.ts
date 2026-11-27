import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  CHORD_WINDOW_MS,
  dispatchKey,
  findConflicts,
  keyBelongsToApp,
  registerCommands,
  resetChord,
  setRecording,
  strokeOf,
  useCommandStore,
} from "./commands";

const key = (overrides: Partial<Parameters<typeof dispatchKey>[0]>) => ({
  key: "a",
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  metaKey: false,
  preventDefault: () => {},
  ...overrides,
});

const runs: string[] = [];
let unregister: () => void = () => {};

beforeEach(() => {
  runs.length = 0;
  resetChord();
  unregister = registerCommands(
    [
      ["explorer", "Ctrl+B"],
      ["terminal", "Ctrl+`"],
      ["preview", "Ctrl+Shift+V"],
      ["mood", "Ctrl+K M"],
      ["mascot", "Ctrl+Alt+M"],
      ["unbound", undefined],
    ].map(([id, keys]) => ({
      id: id ?? "",
      title: id ?? "",
      keys,
      run: () => runs.push(id ?? ""),
    })),
  );
});

afterEach(() => unregister());

describe("strokeOf", () => {
  test("names modifiers in a fixed order and normalizes keys", () => {
    expect(strokeOf(key({ key: "v", ctrlKey: true, shiftKey: true }))).toBe("Ctrl+Shift+V");
    expect(strokeOf(key({ key: "m", metaKey: true, altKey: true }))).toBe("Ctrl+Alt+M");
    expect(strokeOf(key({ key: "Dead", code: "Backquote", ctrlKey: true }))).toBe("Ctrl+`");
    expect(strokeOf(key({ key: "Enter" }))).toBe("Enter");
  });
});

describe("dispatchKey", () => {
  test("runs single-stroke commands and prevents the browser default", () => {
    const preventDefault = vi.fn();
    dispatchKey(key({ key: "b", ctrlKey: true, preventDefault }));
    dispatchKey(key({ key: "`", ctrlKey: true }));
    dispatchKey(key({ key: "V", ctrlKey: true, shiftKey: true }));
    expect(runs).toEqual(["explorer", "terminal", "preview"]);
    expect(preventDefault).toHaveBeenCalled();
  });

  test("runs chords only when the second key comes in time", () => {
    dispatchKey(key({ key: "k", ctrlKey: true }), 0);
    dispatchKey(key({ key: "m" }), 100);
    expect(runs).toEqual(["mood"]);

    dispatchKey(key({ key: "k", ctrlKey: true }), 1000);
    dispatchKey(key({ key: "m" }), 1000 + CHORD_WINDOW_MS + 1);
    expect(runs).toEqual(["mood"]);
  });

  test("a different key cancels a pending chord", () => {
    dispatchKey(key({ key: "k", ctrlKey: true }), 0);
    dispatchKey(key({ key: "x" }), 10);
    dispatchKey(key({ key: "m" }), 20);
    expect(runs).toEqual([]);
  });

  test("ignores keys nobody registered", () => {
    const preventDefault = vi.fn();
    dispatchKey(key({ key: "c", ctrlKey: true, preventDefault }));
    expect(runs).toEqual([]);
    expect(preventDefault).not.toHaveBeenCalled();
  });
});

describe("keyBelongsToApp", () => {
  test.each([
    ["Ctrl+`", key({ key: "`", ctrlKey: true })],
    ["Ctrl+B", key({ key: "b", ctrlKey: true })],
    ["Ctrl+K", key({ key: "k", ctrlKey: true })],
    ["Ctrl+Alt+M", key({ key: "m", ctrlKey: true, altKey: true })],
  ])("sends %s to the app", (_name, event) => {
    expect(keyBelongsToApp(event)).toBe(true);
  });

  test.each([
    ["plain letters", key({ key: "m" })],
    ["Ctrl+C", key({ key: "c", ctrlKey: true })],
    ["Ctrl+R", key({ key: "r", ctrlKey: true })],
  ])("keeps %s in the terminal", (_name, event) => {
    expect(keyBelongsToApp(event)).toBe(false);
  });

  test("sends the second key of a pending chord to the app", () => {
    dispatchKey(key({ key: "k", ctrlKey: true }), 0);
    expect(keyBelongsToApp(key({ key: "m" }), 100)).toBe(true);
    expect(keyBelongsToApp(key({ key: "m" }), CHORD_WINDOW_MS + 1)).toBe(false);
  });
});

test("unregistering removes only the commands it added", () => {
  const extra = registerCommands([{ id: "extra", title: "Extra", run: () => {} }]);
  extra();
  expect(Object.keys(useCommandStore.getState().commands)).toContain("explorer");
  expect(Object.keys(useCommandStore.getState().commands)).not.toContain("extra");
});

describe("custom shortcuts", () => {
  afterEach(() => {
    useCommandStore.setState({ overrides: {} });
    setRecording(false);
  });

  test("an override replaces the default keys and a null one removes them", () => {
    useCommandStore.setState({ overrides: { explorer: "Ctrl+Shift+E", terminal: null } });

    dispatchKey(key({ key: "b", ctrlKey: true }));
    dispatchKey(key({ key: "`", ctrlKey: true }));
    dispatchKey(key({ key: "E", ctrlKey: true, shiftKey: true }));

    expect(runs).toEqual(["explorer"]);
  });

  test("nothing runs while a shortcut is being recorded", () => {
    setRecording(true);
    dispatchKey(key({ key: "b", ctrlKey: true }));
    expect(runs).toEqual([]);
  });

  test("finds commands that share the same keys", () => {
    const commands = Object.values(useCommandStore.getState().commands);
    expect(findConflicts(commands, {})).toEqual({});
    expect(findConflicts(commands, { mascot: "Ctrl+B" })).toEqual({
      "Ctrl+B": ["explorer", "mascot"],
    });
  });
});
