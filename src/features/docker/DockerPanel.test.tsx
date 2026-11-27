import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { mockDockerActions, setMockDocker } from "../../lib/ipc.mock";
import { onTerminalRequest, type TerminalRequest } from "../../lib/terminalRequests";
import { DockerPanel } from "./DockerPanel";
import { useDockerStore } from "./useDockerStore";

beforeEach(() => {
  setMockDocker(true);
  useDockerStore.setState({ containers: [], error: null, loaded: false, pending: {} });
});

afterEach(() => setMockDocker(true));

async function renderPanel(visible = true) {
  await act(async () => {
    render(<DockerPanel visible={visible} />);
  });
}

test("lists running and stopped containers", async () => {
  await renderPanel();

  const running = screen.getByRole("region", { name: "Running containers" });
  const stopped = screen.getByRole("region", { name: "Stopped containers" });
  expect(within(running).getByText("shop-db-1")).toBeTruthy();
  expect(within(stopped).getByText("shop-mail-1")).toBeTruthy();
  expect(within(stopped).getByText("scratch")).toBeTruthy();
});

test("does not ask Docker while hidden", async () => {
  await renderPanel(false);

  expect(useDockerStore.getState().loaded).toBe(false);
});

test("starts a stopped container and moves it to running", async () => {
  await renderPanel();

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Start shop-mail-1" }));
  });

  expect(mockDockerActions()).toEqual(["start shop-mail-1"]);
  const running = screen.getByRole("region", { name: "Running containers" });
  expect(within(running).getByText("shop-mail-1")).toBeTruthy();
});

test("opens the logs in a terminal", async () => {
  const requests: TerminalRequest[] = [];
  const stop = onTerminalRequest((request) => requests.push(request));
  await renderPanel();

  fireEvent.click(screen.getByRole("button", { name: "Logs of shop-db-1" }));
  stop();

  expect(requests).toEqual([
    { label: "shop-db-1", command: "docker logs --follow --tail 200 a1b2c3d4e5f6" },
  ]);
});

test("shows a discreet notice when Docker is missing", async () => {
  setMockDocker(false);
  await renderPanel();

  expect(screen.getByRole("status").textContent).toBe(
    "Docker is not installed or not on the PATH.",
  );
  expect(screen.queryByRole("region")).toBeNull();
});
