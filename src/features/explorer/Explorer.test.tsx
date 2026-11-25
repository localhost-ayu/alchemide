import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { emitMockFsChange, setMockDir } from "../../lib/ipc.mock";
import { Explorer } from "./Explorer";
import { useWorkspaceStore } from "./useWorkspaceStore";

beforeEach(() => {
  useWorkspaceStore.setState({
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
