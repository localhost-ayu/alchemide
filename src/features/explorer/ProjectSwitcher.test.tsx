import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { resetMockFiles, setMockRecentFolders } from "../../lib/ipc.mock";
import { Explorer } from "./Explorer";
import { matchFolders } from "./ProjectSwitcher";
import { useWorkspaceStore } from "./useWorkspaceStore";

const sample = { name: "sample-project", path: "/home/user/sample-project" };
const notes = { name: "lab-notes", path: "/home/user/lab-notes" };

beforeEach(() => {
  resetMockFiles();
  setMockRecentFolders([sample, notes]);
  useWorkspaceStore.setState({
    folder: null,
    children: {},
    expanded: {},
    selected: null,
    error: null,
    creating: null,
    renaming: null,
    contextMenu: null,
  });
});

test("matches projects by name or path", () => {
  expect(matchFolders([sample, notes], "LAB")).toEqual([notes]);
  expect(matchFolders([sample, notes], "/home/user/s")).toEqual([sample]);
  expect(matchFolders([sample, notes], "")).toEqual([sample, notes]);
});

test("lists recent projects while no folder is open and opens one", async () => {
  render(<Explorer />);
  const recent = await screen.findByRole("region", { name: "Recent projects" });
  await act(async () => {
    fireEvent.click(within(recent).getByRole("button", { name: "sample-project" }));
  });
  expect(screen.getByRole("heading", { name: "sample-project" })).toBeTruthy();
});

test("the project name opens a searchable switcher", async () => {
  render(<Explorer />);
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Open folder" }));
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "sample-project" }));
  });
  const switcher = screen.getByRole("dialog", { name: "Projects" });
  expect(
    within(switcher)
      .getByRole("button", { name: /sample-project/ })
      .getAttribute("aria-current"),
  ).toBe("true");

  fireEvent.change(within(switcher).getByRole("textbox", { name: "Search projects…" }), {
    target: { value: "lab" },
  });
  await act(async () => {
    fireEvent.keyDown(within(switcher).getByRole("textbox"), { key: "Enter" });
  });
  expect(screen.getByRole("heading", { name: "lab-notes" })).toBeTruthy();
  expect(screen.queryByRole("dialog", { name: "Projects" })).toBeNull();
});

test("Ctrl+Alt+O opens the switcher", async () => {
  render(<Explorer />);
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Open folder" }));
  });
  await act(async () => {
    fireEvent.keyDown(window, { key: "o", ctrlKey: true, altKey: true });
  });
  expect(screen.getByRole("dialog", { name: "Projects" })).toBeTruthy();
});
