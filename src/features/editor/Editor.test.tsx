import { act, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { useEditorStore } from "../../lib/editorStore";
import { Editor } from "./Editor";

beforeEach(() => {
  useEditorStore.setState({ active: null, error: null });
});

test("asks for a file while nothing is open", () => {
  render(<Editor />);

  expect(screen.getByText("Open a file from the explorer")).toBeTruthy();
});

test("shows the content of the opened file", async () => {
  render(<Editor />);

  await act(() => useEditorStore.getState().openFile("/home/user/sample-project/query.sql"));

  const content = screen.getByRole("textbox", { name: "Editing query.sql" });
  expect(content.textContent).toContain("SELECT id, name");
  expect(screen.queryByText("Open a file from the explorer")).toBeNull();
});

test("shows an error when the file cannot be read", async () => {
  render(<Editor />);

  await act(() => useEditorStore.getState().openFile("/home/user/sample-project/missing.ts"));

  expect(screen.getByRole("alert").textContent).toContain("file not found");
});
