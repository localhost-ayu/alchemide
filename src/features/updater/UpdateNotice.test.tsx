import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { useActivityStore } from "../../lib/activityStore";
import { runCommand } from "../../lib/commands";
import {
  loadSettings,
  mockInstalledUpdates,
  saveSettings,
  setMockUpdate,
} from "../../lib/ipc.mock";
import { UpdateNotice } from "./UpdateNotice";
import { UpdateSettings } from "./UpdateSettings";
import { readCheckOnStart, useUpdaterStore } from "./useUpdaterStore";

beforeEach(async () => {
  await saveSettings({});
  useUpdaterStore.setState({ available: null, installing: false, error: null, checkOnStart: true });
});

afterEach(() => setMockUpdate(null));

test("checks on start and offers to install a newer version", async () => {
  setMockUpdate({ version: "0.2.0", notes: "Command palette" });

  await act(async () => {
    render(<UpdateNotice />);
  });

  expect(screen.getByRole("dialog", { name: "Update available" }).textContent).toContain("0.2.0");
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Install and restart" }));
  });
  expect(mockInstalledUpdates()).toBe(1);
});

test("Later hides the notice", async () => {
  setMockUpdate({ version: "0.2.0", notes: null });
  await act(async () => {
    render(<UpdateNotice />);
  });

  fireEvent.click(screen.getByRole("button", { name: "Later" }));

  expect(screen.queryByRole("dialog")).toBeNull();
});

test("does not check on start when turned off", async () => {
  await saveSettings({ updates: { checkOnStart: false } });
  setMockUpdate({ version: "0.2.0", notes: null });

  await act(async () => {
    render(<UpdateNotice />);
  });

  expect(screen.queryByRole("dialog")).toBeNull();
});

test("the settings switch saves the choice", async () => {
  render(<UpdateSettings />);

  await act(async () => {
    fireEvent.click(screen.getByRole("checkbox", { name: "Check for updates on start" }));
  });

  expect(await loadSettings()).toEqual({ updates: { checkOnStart: false } });
});

test("the command says so when the app is up to date", async () => {
  await act(async () => {
    render(<UpdateNotice />);
  });

  await act(async () => runCommand("updates.check"));

  expect(useActivityStore.getState().message?.text).toBe("Alchemide is up to date");
});

test("reads the saved switch with a safe default", () => {
  expect(readCheckOnStart(undefined)).toBe(true);
  expect(readCheckOnStart({ checkOnStart: false })).toBe(false);
  expect(readCheckOnStart({ checkOnStart: "no" })).toBe(true);
});
