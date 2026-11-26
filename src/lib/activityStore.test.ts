import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { MESSAGE_DURATION_MS, playfulTouchesEnabled, useActivityStore } from "./activityStore";

beforeEach(() => {
  useActivityStore.setState({ busy: 0, message: null });
});

afterEach(() => {
  vi.useRealTimers();
});

test("counts work in progress until it settles, even when it fails", async () => {
  const { track } = useActivityStore.getState();
  let finish: () => void = () => {};
  const slow = track(new Promise<void>((resolve) => (finish = resolve)));
  const failing = track(Promise.reject(new Error("boom"))).catch(() => {});
  expect(useActivityStore.getState().busy).toBe(2);

  await failing;
  expect(useActivityStore.getState().busy).toBe(1);
  finish();
  await slow;
  expect(useActivityStore.getState().busy).toBe(0);
});

test("shows a message for a few seconds, and a newer message replaces it", () => {
  vi.useFakeTimers();
  const { notify } = useActivityStore.getState();

  notify("first");
  vi.advanceTimersByTime(MESSAGE_DURATION_MS - 1000);
  notify("second");
  vi.advanceTimersByTime(1000);
  expect(useActivityStore.getState().message?.text).toBe("second");

  vi.advanceTimersByTime(MESSAGE_DURATION_MS);
  expect(useActivityStore.getState().message).toBeNull();
});

test("playful touches follow the animations effect", () => {
  const root = document.createElement("html");
  root.dataset.animations = "true";
  expect(playfulTouchesEnabled(root)).toBe(true);
  root.dataset.animations = "false";
  expect(playfulTouchesEnabled(root)).toBe(false);
});
