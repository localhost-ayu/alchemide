import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { useEditorStore } from "../../lib/editorStore";
import {
  emitMockFsChange,
  resetMockFiles,
  setMockDir,
  setMockLastFolder,
} from "../../lib/ipc.mock";
import { Explorer } from "./Explorer";
import { useWorkspaceStore } from "./useWorkspaceStore";

beforeEach(() => {
  resetMockFiles();
  useWorkspaceStore.setState({
    creating: null,
    folder: null,
    children: {},
    expanded: {},
    selected: null,
    error: null,
  });
});

async function openSampleFolder() {
  render(<Explorer />);
  fireEvent.click(screen.getByRole("button", { name: "Open folder" }));
  await screen.findByRole("heading", { name: "sample-project" });
}

test("shows the folder name and its top-level entries after picking a folder", async () => {
  await openSampleFolder();

  expect(screen.queryByRole("button", { name: "Open folder" })).toBeNull();
  expect(await screen.findByRole("button", { name: "src" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "README.md" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "App.tsx" })).toBeNull();
});

test("loads a folder's children only when it is expanded", async () => {
  await openSampleFolder();
  const src = await screen.findByRole("button", { name: "src" });

  fireEvent.click(src);
  expect(await screen.findByRole("button", { name: "App.tsx" })).toBeTruthy();
  expect(src.getAttribute("aria-expanded")).toBe("true");

  fireEvent.click(src);
  expect(screen.queryByRole("button", { name: "App.tsx" })).toBeNull();
});

test("reloads an open folder when the disk changes", async () => {
  await openSampleFolder();
  const root = "/home/user/sample-project";
  await screen.findByRole("button", { name: "README.md" });

  setMockDir(root, [{ name: "NOTES.md", path: `${root}/NOTES.md`, isDir: false }]);
  emitMockFsChange([root, `${root}/not-loaded`]);

  expect(await screen.findByRole("button", { name: "NOTES.md" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "README.md" })).toBeNull();
});

test("reopens the last folder when one is remembered", async () => {
  setMockLastFolder(true);
  render(<Explorer />);

  await act(() => useWorkspaceStore.getState().restoreLastFolder());

  expect(screen.getByRole("heading", { name: "sample-project" })).toBeTruthy();
  setMockLastFolder(false);
});

test("stays on the open button when no folder is remembered", async () => {
  render(<Explorer />);

  await act(() => useWorkspaceStore.getState().restoreLastFolder());

  expect(screen.getByRole("button", { name: "Open folder" })).toBeTruthy();
});

test("creates a file in the selected folder, opens it, and refuses an existing name", async () => {
  await openSampleFolder();
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "src" }));
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "New file" }));
  });

  const input = screen.getByRole("textbox", { name: "New file name" });
  fireEvent.change(input, { target: { value: "App.tsx" } });
  await act(async () => {
    fireEvent.keyDown(input, { key: "Enter" });
  });
  expect(screen.getByRole("alert").textContent).toMatch(/already exists/);

  fireEvent.change(input, { target: { value: "utils/date.ts" } });
  await act(async () => {
    fireEvent.keyDown(input, { key: "Enter" });
  });
  expect(screen.queryByRole("textbox", { name: "New file name" })).toBeNull();
  expect(screen.getByRole("button", { name: "utils" })).toBeTruthy();
  expect(useEditorStore.getState().activePath).toBe("/home/user/sample-project/src/utils/date.ts");
});

test("Ctrl+N with a file selected creates next to it; Escape cancels", async () => {
  await openSampleFolder();
  useWorkspaceStore.setState({ selected: "/home/user/sample-project/README.md" });
  await act(async () => {
    fireEvent.keyDown(window, { key: "n", ctrlKey: true });
  });
  const input = screen.getByRole("textbox", { name: "New file name" });
  expect(useWorkspaceStore.getState().creating?.parent).toBe("/home/user/sample-project");

  fireEvent.keyDown(input, { key: "Escape" });
  expect(screen.queryByRole("textbox", { name: "New file name" })).toBeNull();
});

test("creates a folder from the header button", async () => {
  await openSampleFolder();
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "New folder" }));
  });
  const input = screen.getByRole("textbox", { name: "New folder name" });
  fireEvent.change(input, { target: { value: "docs" } });
  await act(async () => {
    fireEvent.keyDown(input, { key: "Enter" });
  });
  expect(screen.getByRole("button", { name: "docs" }).getAttribute("aria-expanded")).toBe("false");
});
