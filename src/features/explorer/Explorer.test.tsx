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
  useEditorStore.setState({ tabs: [], activePath: null, drafts: {} });
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

const ROOT = "/home/user/sample-project";

async function expandSrc() {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "src" }));
  });
}

test("renames a file inline and its open tab follows", async () => {
  await openSampleFolder();
  await expandSrc();
  await act(() => useEditorStore.getState().openFile(`${ROOT}/src/main.ts`));

  fireEvent.contextMenu(screen.getByRole("button", { name: "main.ts" }));
  fireEvent.click(screen.getByRole("menuitem", { name: /Rename/ }));
  const input = screen.getByRole("textbox", { name: "New name for main.ts" });
  fireEvent.change(input, { target: { value: "index.ts" } });
  await act(async () => {
    fireEvent.keyDown(input, { key: "Enter" });
  });

  expect(screen.getByRole("button", { name: "index.ts" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "main.ts" })).toBeNull();
  const tabs = useEditorStore.getState().tabs.map((tab) => tab.path);
  expect(tabs).toContain(`${ROOT}/src/index.ts`);
  expect(tabs).not.toContain(`${ROOT}/src/main.ts`);
});

test("refuses to rename while an affected tab has unsaved changes", async () => {
  await openSampleFolder();
  await expandSrc();
  await act(() => useEditorStore.getState().openFile(`${ROOT}/src/App.tsx`));
  act(() => useEditorStore.getState().setDirty(`${ROOT}/src/App.tsx`, true));

  fireEvent.contextMenu(screen.getByRole("button", { name: "src" }));
  fireEvent.click(screen.getByRole("menuitem", { name: /Rename/ }));
  const input = screen.getByRole("textbox", { name: "New name for src" });
  fireEvent.change(input, { target: { value: "source" } });
  await act(async () => {
    fireEvent.keyDown(input, { key: "Enter" });
  });

  expect(screen.getByRole("alert").textContent).toBe("Save or close App.tsx first");
  expect(screen.queryByRole("button", { name: "source" })).toBeNull();
});

test("Delete on a focused file asks, moves it to the trash and closes its tab", async () => {
  await openSampleFolder();
  await act(() => useEditorStore.getState().openFile(`${ROOT}/README.md`));
  const asked: string[] = [];
  const original = window.confirm;
  window.confirm = (question?: string) => {
    asked.push(question ?? "");
    return asked.length > 1;
  };

  const file = screen.getByRole("button", { name: "README.md" });
  fireEvent.click(file);
  await act(async () => {
    fireEvent.keyDown(file, { key: "Delete" });
  });
  expect(screen.getByRole("button", { name: "README.md" })).toBeTruthy();

  await act(async () => {
    fireEvent.keyDown(screen.getByRole("button", { name: "README.md" }), { key: "Delete" });
  });
  window.confirm = original;

  expect(asked[0]).toBe("Move README.md to the trash?");
  expect(screen.queryByRole("button", { name: "README.md" })).toBeNull();
  expect(useEditorStore.getState().tabs.some((tab) => tab.path.endsWith("README.md"))).toBe(false);
});

test("F2 renames the focused item and the open folder itself cannot be renamed", async () => {
  await openSampleFolder();
  const file = screen.getByRole("button", { name: "query.sql" });
  fireEvent.click(file);
  fireEvent.keyDown(file, { key: "F2" });
  expect(screen.getByRole("textbox", { name: "New name for query.sql" })).toBeTruthy();
  fireEvent.keyDown(screen.getByRole("textbox", { name: "New name for query.sql" }), {
    key: "Escape",
  });

  act(() => useWorkspaceStore.getState().startRename(ROOT));
  expect(useWorkspaceStore.getState().renaming).toBeNull();
});
