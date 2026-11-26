import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { openFolder, setMockEnvironment } from "../../lib/ipc.mock";
import { EnvironmentBadge } from "./EnvironmentBadge";

afterEach(() => {
  setMockEnvironment({ kind: "linux" });
});

test("updates when a folder inside WSL is opened from Windows", async () => {
  setMockEnvironment({ kind: "windows" });
  render(<EnvironmentBadge />);
  expect(await screen.findByText("Windows")).toBeTruthy();

  setMockEnvironment({ kind: "wsl", distro: "Ubuntu" });
  await act(() => openFolder());

  expect(await screen.findByText("WSL · Ubuntu")).toBeTruthy();
});
