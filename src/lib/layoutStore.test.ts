import { beforeEach, expect, test } from "vitest";
import { loadSettings, saveSettings } from "./ipc.mock";
import {
  DEFAULT_LAYOUT,
  initLayout,
  readLayout,
  SIDEBAR_WIDTH,
  TERMINAL_HEIGHT,
  useLayoutStore,
} from "./layoutStore";

beforeEach(async () => {
  await saveSettings({});
  useLayoutStore.setState({ ...DEFAULT_LAYOUT, zen: false });
});

test("reads a saved layout and ignores invalid fields", () => {
  expect(readLayout({ sidebar: "docker", statusBar: false, tabs: "no", activityBar: 0 })).toEqual({
    ...DEFAULT_LAYOUT,
    sidebar: "docker",
    statusBar: false,
  });
  expect(readLayout(null)).toEqual(DEFAULT_LAYOUT);
  expect(readLayout({ sidebar: "git" }).sidebar).toBe("explorer");
});

test("saves changes next to the other settings", async () => {
  await saveSettings({ theme: "Maré" });

  await useLayoutStore.getState().update({ statusBar: false });

  expect(await loadSettings()).toEqual({
    theme: "Maré",
    layout: { ...DEFAULT_LAYOUT, statusBar: false },
  });
});

test("clicking the open view collapses the side bar and another view switches to it", async () => {
  const { toggleView } = useLayoutStore.getState();

  await toggleView("explorer");
  expect(useLayoutStore.getState().sidebarOpen).toBe(false);

  await toggleView("docker");
  expect(useLayoutStore.getState()).toMatchObject({ sidebar: "docker", sidebarOpen: true });

  await toggleView("search");
  expect(useLayoutStore.getState()).toMatchObject({ sidebar: "search", sidebarOpen: true });
});

test("showing a view leaves zen mode, and zen mode is not saved", async () => {
  useLayoutStore.getState().toggleZen();
  expect(useLayoutStore.getState().zen).toBe(true);

  await useLayoutStore.getState().showView("search");

  expect(useLayoutStore.getState().zen).toBe(false);
  expect((await loadSettings()).layout).not.toHaveProperty("zen");
});

test("restores the saved layout on start", async () => {
  await saveSettings({ layout: { sidebarOpen: false, tabs: false } });

  await initLayout();

  expect(useLayoutStore.getState()).toMatchObject({ sidebarOpen: false, tabs: false });
});

test("reads panel sizes within their limits", () => {
  expect(readLayout({ sidebarWidth: 320, terminalHeight: 400 })).toMatchObject({
    sidebarWidth: 320,
    terminalHeight: 400,
  });
  expect(readLayout({ sidebarWidth: 10, terminalHeight: 5000 })).toMatchObject({
    sidebarWidth: SIDEBAR_WIDTH.min,
    terminalHeight: TERMINAL_HEIGHT.max,
  });
  expect(readLayout({ sidebarWidth: "wide", terminalHeight: Number.NaN })).toMatchObject({
    sidebarWidth: SIDEBAR_WIDTH.default,
    terminalHeight: TERMINAL_HEIGHT.default,
  });
});

test("previews a size without saving it and saves it on update", async () => {
  await saveSettings({});
  useLayoutStore.getState().preview({ sidebarWidth: 300 });
  expect(useLayoutStore.getState().sidebarWidth).toBe(300);
  expect((await loadSettings()).layout).toBeUndefined();

  await useLayoutStore.getState().update({ sidebarWidth: 340 });

  expect((await loadSettings()).layout).toMatchObject({ sidebarWidth: 340 });
});

test("reads the menu bar mode and falls back to auto", () => {
  expect(readLayout({ menuBar: "always" }).menuBar).toBe("always");
  expect(readLayout({ menuBar: "sometimes" }).menuBar).toBe("auto");
  expect(readLayout({}).menuBar).toBe("auto");
});
