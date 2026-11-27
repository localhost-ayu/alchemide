import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { loadSettings, saveSettings } from "../../lib/ipc.mock";
import { Mascot } from "./Mascot";
import { initMascotLock, setMascotLocked } from "./mascotLock";
import { initThemes, useThemeStore } from "./useThemeStore";

const root = document.documentElement;

beforeEach(async () => {
  await saveSettings({ mascot: { path: "mascots/sample-flask.svg", size: 100 } });
  await initThemes();
  await initMascotLock();
});

async function renderMascot() {
  const view = render(
    <main style={{ position: "relative" }}>
      <Mascot />
    </main>,
  );
  await waitFor(() => expect(view.container.querySelector(".mascot img")).not.toBeNull());
  const mascot = view.container.querySelector(".mascot") as HTMLElement;
  return { ...view, mascot };
}

function boxes(mascot: HTMLElement) {
  const area = mascot.parentElement as HTMLElement;
  area.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1100, height: 650 }) as DOMRect;
  mascot.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 150 }) as DOMRect;
  mascot.setPointerCapture = () => undefined;
}

test("starts locked, behind the code, and ignores drags", async () => {
  const { mascot } = await renderMascot();
  expect(mascot.dataset.locked).toBe("true");
  expect(root.dataset.mascotLocked).toBe("true");
  expect(root.dataset.mascotLayer).toBe("behind");

  boxes(mascot);
  fireEvent.pointerDown(mascot, { button: 0, clientX: 10, clientY: 10 });
  fireEvent.pointerMove(mascot, { clientX: 510, clientY: 260 });
  fireEvent.pointerUp(mascot);
  expect(root.dataset.mascotCorner).toBe("bottom-right");
});

test("unlocked, it is dragged anywhere, saved, and double click sends it back", async () => {
  await act(() => setMascotLocked(false));
  const { mascot } = await renderMascot();
  boxes(mascot);

  fireEvent.pointerDown(mascot, { button: 0, clientX: 10, clientY: 10 });
  fireEvent.pointerMove(mascot, { clientX: 510, clientY: 260 });
  expect(root.dataset.mascotCorner).toBe("free");
  expect(root.style.getPropertyValue("--mascot-x")).toBe("0.5");
  await act(async () => {
    fireEvent.pointerUp(mascot);
  });

  expect(await loadSettings()).toMatchObject({
    mascotLocked: false,
    mascot: { path: "mascots/sample-flask.svg", position: { x: 0.5, y: 0.5 } },
  });

  await act(async () => {
    fireEvent.doubleClick(mascot);
  });
  expect(root.dataset.mascotCorner).toBe("bottom-right");
  expect((await loadSettings()).mascot).not.toHaveProperty("position");
});

test("an animated mascot stands still when animations are off", async () => {
  await saveSettings({ mascot: { path: "mascots/sample-dance.gif" } });
  await initThemes();
  const view = render(<Mascot />);
  await waitFor(() => expect(view.container.querySelector(".mascot img")).not.toBeNull());

  await act(() =>
    useThemeStore.getState().commit(useThemeStore.getState().theme, {
      ...useThemeStore.getState().effects,
      animations: false,
    }),
  );
  expect(view.container.querySelector(".mascot canvas")).not.toBeNull();
  expect(view.container.querySelector(".mascot img")).toBeNull();
});
