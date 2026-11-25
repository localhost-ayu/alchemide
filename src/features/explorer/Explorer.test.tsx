import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { Explorer } from "./Explorer";
import { useWorkspaceStore } from "./useWorkspaceStore";

beforeEach(() => {
  useWorkspaceStore.setState({ folder: null, error: null });
});

test("shows the folder name after picking a folder", async () => {
  render(<Explorer />);

  fireEvent.click(screen.getByRole("button", { name: "Open folder" }));

  expect(await screen.findByRole("heading", { name: "sample-project" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Open folder" })).toBeNull();
});
