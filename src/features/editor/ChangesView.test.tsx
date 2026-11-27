import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { useEditorStore } from "../../lib/editorStore";
import { resetMockGit } from "../../lib/ipc.mock";
import { ChangesView } from "./ChangesView";
import { useChangesStore } from "./useChangesStore";

beforeEach(() => {
  resetMockGit();
  useChangesStore.setState({ open: true, layout: "split" });
  useEditorStore.setState({ tabs: [], activePath: null, drafts: {} });
});

async function renderView() {
  render(<ChangesView />);
  await act(async () => {});
  return screen.getByRole("list", { name: "Changed files" });
}

test("lists every changed file with its line counts and a side by side diff", async () => {
  const list = await renderView();
  const items = within(list).getAllByRole("listitem");
  expect(items.map((item) => item.querySelector(".changes__path")?.textContent)).toEqual([
    "src/App.tsx",
    "README.md",
    "notes.txt",
  ]);
  expect(items[0]?.textContent).toContain("+2");
  expect(items[0]?.textContent).toContain("−1");
  expect(items[1]?.textContent).toContain("staged");
  expect(document.querySelectorAll(".cm-mergeView")).toHaveLength(3);
  expect(screen.getByRole("region", { name: "Uncommitted Changes" }).textContent).toContain("+6");
});

test("switches to the unified layout and collapses a file", async () => {
  await renderView();
  fireEvent.click(screen.getByRole("button", { name: "Unified" }));
  expect(document.querySelectorAll(".cm-mergeView")).toHaveLength(0);
  expect(document.querySelectorAll(".file-diff .cm-editor")).toHaveLength(3);

  fireEvent.click(screen.getByRole("button", { name: "Collapse notes.txt" }));
  expect(document.querySelectorAll(".file-diff")).toHaveLength(2);
  expect(screen.getByRole("button", { name: "Expand notes.txt" })).toBeTruthy();
});

test("stages a file, commits and opens a file", async () => {
  await renderView();
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Stage src/App.tsx" }));
  });
  expect(screen.getByRole("button", { name: "Unstage src/App.tsx" })).toBeTruthy();

  fireEvent.change(screen.getByRole("textbox", { name: "Commit message" }), {
    target: { value: "feat: lab" },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Commit 2 files" }));
  });
  expect(screen.queryByRole("button", { name: "Unstage src/App.tsx" })).toBeNull();

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Open notes.txt" }));
  });
  expect(useChangesStore.getState().open).toBe(false);
});
