import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { selectActiveTab, useEditorStore } from "../../lib/editorStore";
import { QuickOpen } from "./QuickOpen";

beforeEach(() => {
  useEditorStore.setState({
    tabs: [],
    activePath: null,
    cursor: null,
    drafts: {},
    scroll: 0,
    reveal: null,
    error: null,
  });
});

async function openQuickOpen() {
  await act(async () => {
    fireEvent.keyDown(window, { key: "p", ctrlKey: true });
  });
  return screen.getByRole("combobox", { name: "Go to file" });
}

test("Ctrl+P lists project files with their folders", async () => {
  render(<QuickOpen />);

  await openQuickOpen();

  expect(screen.getByRole("option", { name: "App.tsxsrc" })).toBeTruthy();
  expect(screen.getByRole("option", { name: "README.md" })).toBeTruthy();
});

test("finds a file with fuzzy search and opens it", async () => {
  render(<QuickOpen />);
  const search = await openQuickOpen();

  fireEvent.change(search, { target: { value: "srcstyl" } });
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
    "styles.csssrc",
  ]);
  await act(async () => {
    fireEvent.keyDown(search, { key: "Enter" });
  });

  expect(selectActiveTab(useEditorStore.getState())?.name).toBe("styles.css");
});
