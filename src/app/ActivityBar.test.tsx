import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { registerCommands } from "../lib/commands";
import { saveSettings } from "../lib/ipc.mock";
import { DEFAULT_LAYOUT, useLayoutStore } from "../lib/layoutStore";
import { ActivityBar } from "./ActivityBar";

beforeEach(async () => {
  await saveSettings({});
  useLayoutStore.setState({ ...DEFAULT_LAYOUT, zen: false });
});

test("marks the open view and switches views", async () => {
  render(<ActivityBar />);
  expect(screen.getByRole("button", { name: "Explorer", pressed: true })).toBeTruthy();

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Docker" }));
  });

  expect(screen.getByRole("button", { name: "Docker", pressed: true })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Explorer", pressed: false })).toBeTruthy();
});

test("collapses the side bar when the open view is clicked again", async () => {
  render(<ActivityBar />);

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Explorer" }));
  });

  expect(useLayoutStore.getState().sidebarOpen).toBe(false);
  expect(screen.queryByRole("button", { pressed: true })).toBeNull();
});

test("opens the settings", () => {
  const opened: string[] = [];
  const unregister = registerCommands([
    { id: "settings.open", title: "Open settings", run: () => opened.push("settings") },
  ]);
  render(<ActivityBar />);

  fireEvent.click(screen.getByRole("button", { name: "Settings" }));
  unregister();

  expect(opened).toEqual(["settings"]);
});
