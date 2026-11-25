import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { App } from "./App";

test("renders the explorer, the editor and the status bar", async () => {
  render(<App />);

  expect(screen.getByRole("complementary", { name: "Explorer" })).toBeTruthy();
  expect(screen.getByRole("main", { name: "Editor" })).toBeTruthy();
  expect(await screen.findByText("Linux")).toBeTruthy();
});
