import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
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
