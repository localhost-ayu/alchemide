import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { useEditorStore } from "../../lib/editorStore";
import { MarkdownPane } from "./MarkdownPane";
import { usePreviewStore } from "./usePreviewStore";

const root = "/home/user/sample-project";

beforeEach(() => {
  usePreviewStore.setState({ isOpen: false });
  useEditorStore.setState({
    tabs: [],
    activePath: null,
    cursor: null,
    drafts: {},
    scroll: 0,
    error: null,
  });
});

async function openFile(path: string) {
  await act(() => useEditorStore.getState().openFile(path));
}

function togglePreview() {
  act(() => {
    fireEvent.keyDown(window, { key: "V", ctrlKey: true, shiftKey: true });
  });
}

test("Ctrl+Shift+V shows a Markdown file rendered with GFM", async () => {
  render(<MarkdownPane />);
  await openFile(`${root}/README.md`);
  expect(screen.queryByRole("region", { name: "Markdown preview" })).toBeNull();

  togglePreview();

  expect(screen.getByRole("heading", { level: 1, name: "Sample project" })).toBeTruthy();
  expect(screen.getByRole("table")).toBeTruthy();
  expect(screen.getByRole("cell", { name: "2 ml" })).toBeTruthy();
  const tasks = screen.getAllByRole("checkbox") as HTMLInputElement[];
  expect(tasks.map((task) => task.checked)).toEqual([true, false]);

  togglePreview();
  expect(screen.queryByRole("region", { name: "Markdown preview" })).toBeNull();
});

test("follows unsaved edits", async () => {
  render(<MarkdownPane />);
  await openFile(`${root}/README.md`);
  togglePreview();

  act(() => useEditorStore.getState().setDraft(`${root}/README.md`, "# Changed title"));

  expect(screen.getByRole("heading", { name: "Changed title" })).toBeTruthy();
});

test("stays hidden for files that are not Markdown", async () => {
  render(<MarkdownPane />);
  await openFile(`${root}/query.sql`);

  togglePreview();

  expect(screen.queryByRole("region", { name: "Markdown preview" })).toBeNull();
});
