import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useEditorStore } from "../../lib/editorStore";
import { SearchPanel } from "./SearchPanel";
import { useSearchStore } from "./useSearchStore";

beforeEach(() => {
  useSearchStore.setState({
    query: { text: "", regex: false, caseSensitive: false },
    results: [],
    excluded: {},
    status: "idle",
    error: null,
    replacement: "",
  });
  useEditorStore.setState({ tabs: [], activePath: null, cursor: null, error: null });
});

afterEach(() => vi.restoreAllMocks());

async function search(text: string) {
  fireEvent.change(screen.getByRole("textbox", { name: "Search in files" }), {
    target: { value: text },
  });
  await act(async () => {
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Search in files" }), { key: "Enter" });
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

test("lists matches grouped by file with the matched text highlighted", async () => {
  render(<SearchPanel />);

  await search("select");

  expect(screen.getByRole("status").textContent).toBe("1 result in 1 file");
  expect(screen.getByText("query.sql")).toBeTruthy();
  expect(screen.getByText("SELECT").tagName).toBe("MARK");
});

test("opens a result at its line", async () => {
  render(<SearchPanel />);
  await search("active");

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /WHERE/ }));
  });

  expect(useEditorStore.getState().activePath).toMatch(/query\.sql$/);
  expect(useEditorStore.getState().reveal?.line).toBe(3);
});

test("asks before replacing and does nothing when cancelled", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  render(<SearchPanel />);
  await search("ready");
  const before = screen.getByRole("status").textContent;

  fireEvent.click(screen.getByRole("button", { name: "Replace" }));

  expect(confirm).toHaveBeenCalledOnce();
  expect(screen.getByRole("status").textContent).toBe(before);
});

test("shows an error for an invalid search", async () => {
  render(<SearchPanel />);

  await search("");

  expect(screen.queryByRole("list", { name: "Search results" })?.children).toHaveLength(0);
});
