import { act, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { useActivityStore } from "../../lib/activityStore";
import { ActivityIndicator } from "./ActivityIndicator";

beforeEach(() => {
  useActivityStore.setState({ busy: 0, message: null });
});

test("shows the bubbling flask only while work is in progress", async () => {
  render(<ActivityIndicator />);
  expect(screen.queryByRole("img", { name: "Working" })).toBeNull();

  let finish: () => void = () => {};
  let work: Promise<void> = Promise.resolve();
  act(() => {
    work = useActivityStore.getState().track(new Promise<void>((resolve) => (finish = resolve)));
  });
  expect(screen.getByRole("img", { name: "Working" })).toBeTruthy();

  await act(async () => {
    finish();
    await work;
  });
  expect(screen.queryByRole("img", { name: "Working" })).toBeNull();
});

test("announces messages in the status region", () => {
  render(<ActivityIndicator />);

  act(() => useActivityStore.getState().notify("Experiment #1 saved: a.ts"));

  expect(screen.getByRole("status").textContent).toBe("Experiment #1 saved: a.ts");
});
