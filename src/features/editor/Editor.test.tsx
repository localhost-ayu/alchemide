import { EditorView } from "@codemirror/view";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useEditorStore } from "../../lib/editorStore";
import { readMockFile, writeFile } from "../../lib/ipc.mock";
import { Editor } from "./Editor";

const root = "/home/user/sample-project";

beforeEach(() => {
  useEditorStore.setState({ tabs: [], activePath: null, cursor: null, error: null });
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function open(path: string) {
  await act(() => useEditorStore.getState().openFile(path));
}

function viewOf(name: string): EditorView {
  const content = screen.getByRole("textbox", { name: `Editing ${name}` });
  const view = EditorView.findFromDOM(content);
  if (!view) {
    throw new Error("editor view not found");
  }
  return view;
}

function type(name: string, text: string) {
  act(() => viewOf(name).dispatch({ changes: { from: 0, insert: text } }));
}

test("asks for a file while nothing is open", () => {
  render(<Editor />);

  expect(screen.getByText("Open a file from the explorer")).toBeTruthy();
});

test("shows the opened file in a tab", async () => {
  render(<Editor />);

  await open(`${root}/query.sql`);

  expect(viewOf("query.sql").state.doc.toString()).toContain("SELECT id, name");
  expect(screen.getByRole("tab", { name: "query.sql", selected: true })).toBeTruthy();
  expect(screen.queryByText("Open a file from the explorer")).toBeNull();
});

test("keeps unsaved edits when switching between tabs", async () => {
  render(<Editor />);
  await open(`${root}/query.sql`);
  type("query.sql", "-- draft\n");

  await open(`${root}/README.md`);
  fireEvent.click(screen.getByRole("tab", { name: /query\.sql/ }));

  expect(viewOf("query.sql").state.doc.toString()).toMatch(/^-- draft\n/);
  expect(screen.getByRole("img", { name: "unsaved" })).toBeTruthy();
});

test("does not reset the editor when a tab becomes unsaved or is saved", async () => {
  const setState = vi.spyOn(EditorView.prototype, "setState");
  render(<Editor />);
  await open(`${root}/query.sql`);
  expect(setState).toHaveBeenCalledOnce();

  type("query.sql", "x");
  await act(async () => {
    fireEvent.keyDown(window, { key: "s", ctrlKey: true });
  });

  expect(setState).toHaveBeenCalledOnce();
});

test("clears the unsaved mark when an edit is undone back to the saved text", async () => {
  render(<Editor />);
  await open(`${root}/query.sql`);

  type("query.sql", "x");
  expect(screen.getByRole("img", { name: "unsaved" })).toBeTruthy();

  act(() => viewOf("query.sql").dispatch({ changes: { from: 0, to: 1 } }));
  expect(screen.queryByRole("img", { name: "unsaved" })).toBeNull();
});

test("saves with Ctrl+S and keeps the file's line endings", async () => {
  const path = `${root}/windows.sql`;
  await writeFile(path, "SELECT 1;\r\nSELECT 2;\r\n", false);
  render(<Editor />);
  await open(path);
  type("windows.sql", "-- saved\r\n");

  await act(async () => {
    fireEvent.keyDown(window, { key: "s", ctrlKey: true });
  });

  expect(readMockFile(path)).toBe("-- saved\r\nSELECT 1;\r\nSELECT 2;\r\n");
  expect(screen.queryByRole("img", { name: "unsaved" })).toBeNull();
});

test("asks before closing a tab with unsaved changes", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  render(<Editor />);
  await open(`${root}/query.sql`);
  type("query.sql", "x");

  fireEvent.click(screen.getByRole("button", { name: "Close query.sql" }));
  expect(confirm).toHaveBeenCalledOnce();
  expect(screen.getByRole("tab", { name: /query\.sql/ })).toBeTruthy();

  confirm.mockReturnValue(true);
  fireEvent.keyDown(window, { key: "w", ctrlKey: true });
  expect(screen.queryByRole("tab", { name: /query\.sql/ })).toBeNull();
});

test("closes a saved tab without asking", async () => {
  const confirm = vi.spyOn(window, "confirm");
  render(<Editor />);
  await open(`${root}/query.sql`);

  fireEvent.click(screen.getByRole("button", { name: "Close query.sql" }));

  expect(confirm).not.toHaveBeenCalled();
  expect(screen.getByText("Open a file from the explorer")).toBeTruthy();
});

test("shows an error when the file cannot be read", async () => {
  render(<Editor />);

  await open(`${root}/missing.ts`);

  expect(screen.getByRole("alert").textContent).toContain("file not found");
});
