import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { resetMockGit } from "../../lib/ipc.mock";
import { GitDock } from "./GitDock";
import { useGitStore } from "./useGitStore";

beforeEach(() => {
  resetMockGit();
  useGitStore.setState({
    open: false,
    tab: "changes",
    status: null,
    log: [],
    selection: null,
    diff: null,
    message: "",
    error: null,
  });
});

async function openDock() {
  render(<GitDock />);
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Open Git panel" }));
  });
  return screen.getByRole("complementary", { name: "Git" });
}

test("Ctrl+Shift+G opens the dock with the branch and the changes", async () => {
  render(<GitDock />);
  await act(async () => {
    fireEvent.keyDown(window, { key: "G", ctrlKey: true, shiftKey: true });
  });

  expect(screen.getByText("⎇ main")).toBeTruthy();
  const staged = screen.getByRole("region", { name: "Staged changes" });
  const changes = screen.getByRole("region", { name: "Changes" });
  expect(within(staged).getByText("README.md")).toBeTruthy();
  expect(within(changes).getByText("src/App.tsx")).toBeTruthy();
  expect(within(changes).getByText("notes.txt")).toBeTruthy();
});

test("stages a file, shows its diff and stages everything", async () => {
  await openDock();

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Stage src/App.tsx" }));
  });
  const staged = screen.getByRole("region", { name: "Staged changes" });
  expect(within(staged).getByText("src/App.tsx")).toBeTruthy();

  await act(async () => {
    fireEvent.click(within(staged).getByText("src/App.tsx"));
  });
  expect(screen.getByRole("region", { name: "Diff" }).textContent).toContain("+new line");

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Stage all" }));
  });
  expect(screen.queryByRole("region", { name: "Changes" })).toBeNull();
});

test("commits staged files with a message and shows them in the history", async () => {
  await openDock();
  const commit = () => screen.getByRole("button", { name: /^Commit/ });
  expect(commit()).toHaveProperty("disabled", true);

  fireEvent.change(screen.getByRole("textbox", { name: "Commit message" }), {
    target: { value: "docs: update readme" },
  });
  expect(commit()).toHaveProperty("disabled", false);
  await act(async () => {
    fireEvent.click(commit());
  });

  expect(screen.queryByRole("region", { name: "Staged changes" })).toBeNull();
  await act(async () => {
    fireEvent.click(screen.getByRole("tab", { name: "History" }));
  });
  const history = screen.getByRole("list", { name: "History" });
  expect(within(history).getAllByRole("button")[0]?.textContent).toContain("docs: update readme");

  await act(async () => {
    fireEvent.click(within(history).getAllByRole("button")[0] as HTMLElement);
  });
  expect(screen.getByRole("region", { name: "Diff" }).textContent).toContain("+after");
});

test("unstages a file back to the changes", async () => {
  await openDock();

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Unstage README.md" }));
  });

  expect(screen.queryByRole("region", { name: "Staged changes" })).toBeNull();
  expect(
    within(screen.getByRole("region", { name: "Changes" })).getByText("README.md"),
  ).toBeTruthy();
});
