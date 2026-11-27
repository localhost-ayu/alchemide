import { beforeEach, expect, test } from "vitest";
import { onTerminalOutput } from "../../lib/ipc.mock";
import { useTerminalStore } from "./useTerminalStore";

beforeEach(() => {
  useTerminalStore.setState({ isOpen: false, tabs: [], activeId: null, error: null });
});

test("opening the panel for the first time starts a terminal", async () => {
  await useTerminalStore.getState().toggle();

  const state = useTerminalStore.getState();
  expect(state.isOpen).toBe(true);
  expect(state.tabs).toHaveLength(1);
  expect(state.activeId).toBe(state.tabs[0]?.id);
});

test("hiding and showing again keeps the running terminals", async () => {
  const { toggle } = useTerminalStore.getState();
  await toggle();
  await toggle();
  expect(useTerminalStore.getState().isOpen).toBe(false);

  await toggle();
  expect(useTerminalStore.getState().tabs).toHaveLength(1);
});

test("a terminal that exits leaves its neighbor active and the last one hides the panel", async () => {
  const { openTab } = useTerminalStore.getState();
  await openTab(null, "one");
  await openTab("wsl:Ubuntu", "two");
  const [one, two] = useTerminalStore.getState().tabs;

  useTerminalStore.getState().removeTab(two?.id ?? -1);
  expect(useTerminalStore.getState().activeId).toBe(one?.id);

  useTerminalStore.getState().removeTab(one?.id ?? -1);
  expect(useTerminalStore.getState().isOpen).toBe(false);
  expect(useTerminalStore.getState().activeId).toBeNull();
});

test("shows an error when a profile cannot start", async () => {
  await useTerminalStore.getState().openTab("cmd", "cmd");

  expect(useTerminalStore.getState().error).toContain("not available");
  expect(useTerminalStore.getState().tabs).toHaveLength(0);
});

test("a terminal opened with a command runs it right away", async () => {
  const outputs: string[] = [];
  const stop = await onTerminalOutput(({ data }) => outputs.push(data));

  await useTerminalStore.getState().openTab(null, "logs", "docker logs web");
  stop();

  expect(useTerminalStore.getState().tabs.map(({ label }) => label)).toEqual(["logs"]);
  expect(outputs.join("")).toContain("ran: docker logs web");
});
