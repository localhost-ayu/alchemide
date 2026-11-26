import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { loadSettings, saveSettings } from "../../lib/ipc.mock";
import { Backdrop } from "./Backdrop";
import { Mascot } from "./Mascot";
import { MoodPicker } from "./MoodPicker";
import { initThemes, useThemeStore } from "./useThemeStore";

const root = document.documentElement;

afterEach(() => {
  vi.restoreAllMocks();
});

beforeEach(async () => {
  await saveSettings({});
  await initThemes();
});

async function runPickerAction(label: string) {
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  fireEvent.keyDown(window, { key: "m" });
  const search = screen.getByRole("combobox", { name: "Search themes and effects" });
  fireEvent.change(search, { target: { value: label } });
  await act(async () => {
    fireEvent.keyDown(search, { key: "Enter" });
  });
}

test("picks a background image, shows it and remembers it", async () => {
  const { container } = render(
    <>
      <Backdrop />
      <MoodPicker />
    </>,
  );

  await runPickerAction("choose background");

  await waitFor(() => expect(container.querySelector(".backdrop__media")).not.toBeNull());
  expect(container.querySelector(".backdrop__media")?.getAttribute("src")).toMatch(
    /^data:image\/svg/,
  );
  expect(await loadSettings()).toMatchObject({
    background: { type: "image", path: "backgrounds/sample-lab.svg" },
  });
});

test("picks a mascot, turns the mascot effect on and toggles it with Ctrl+Alt+M", async () => {
  await act(() =>
    useThemeStore.getState().commit(useThemeStore.getState().theme, {
      ...useThemeStore.getState().effects,
      mascot: false,
    }),
  );
  const { container } = render(
    <>
      <Mascot />
      <MoodPicker />
    </>,
  );

  await runPickerAction("choose mascot");
  await waitFor(() => expect(container.querySelector(".mascot")).not.toBeNull());

  expect(container.querySelector(".mascot")?.getAttribute("data-corner")).toBe("bottom-right");
  expect(root.dataset.mascot).toBe("true");

  await act(async () => {
    fireEvent.keyDown(window, { key: "m", ctrlKey: true, altKey: true });
  });
  expect(root.dataset.mascot).toBe("false");
  expect(await loadSettings()).toMatchObject({ effects: { mascot: false } });
});

test("removes the custom background and goes back to the theme's own", async () => {
  await saveSettings({ background: { type: "image", path: "backgrounds/sample-lab.svg" } });
  await initThemes();
  const { container } = render(
    <>
      <Backdrop />
      <MoodPicker />
    </>,
  );
  await waitFor(() => expect(container.querySelector(".backdrop__media")).not.toBeNull());

  await runPickerAction("remove custom background");

  expect(container.querySelector(".backdrop__media")).toBeNull();
  expect(root.style.getPropertyValue("--backdrop-image")).toContain("radial-gradient");
  expect((await loadSettings()).background).toBeNull();
});

test("plays a video background in a loop and pauses it when animations are off", async () => {
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  await saveSettings({ background: { type: "video", path: "backgrounds/sample-loop.webm" } });
  await initThemes();
  const { container } = render(<Backdrop />);

  await waitFor(() => expect(container.querySelector("video")).not.toBeNull());
  expect(container.querySelector("video")?.loop).toBe(true);
  await waitFor(() => expect(play).toHaveBeenCalled());

  const { theme, effects, commit } = useThemeStore.getState();
  await act(() => commit(theme, { ...effects, animations: false }));

  await waitFor(() => expect(pause).toHaveBeenCalled());
});
