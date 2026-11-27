import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ResizeHandle } from "./ResizeHandle";

function setup(orientation: "vertical" | "horizontal", grow: 1 | -1) {
  const handlers = { onPreview: vi.fn(), onCommit: vi.fn(), onReset: vi.fn() };
  render(
    <ResizeHandle
      label="Resize"
      orientation={orientation}
      size={260}
      min={120}
      max={600}
      grow={grow}
      {...handlers}
    />,
  );
  return { handle: screen.getByRole("separator", { name: "Resize" }), ...handlers };
}

test("dragging previews the new size and commits it on release", () => {
  const { handle, onPreview, onCommit } = setup("vertical", 1);

  fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1 });
  fireEvent.pointerMove(handle, { clientX: 140, pointerId: 1 });
  fireEvent.pointerUp(handle, { clientX: 150, pointerId: 1 });

  expect(onPreview).toHaveBeenLastCalledWith(300);
  expect(onCommit).toHaveBeenCalledWith(310);
});

test("a handle on the top edge grows when dragged up", () => {
  const { handle, onCommit } = setup("horizontal", -1);

  fireEvent.pointerDown(handle, { clientY: 500, pointerId: 1 });
  fireEvent.pointerUp(handle, { clientY: 400, pointerId: 1 });

  expect(onCommit).toHaveBeenCalledWith(360);
});

test("arrow keys resize in steps and double click resets", () => {
  const { handle, onCommit, onReset } = setup("vertical", 1);

  fireEvent.keyDown(handle, { key: "ArrowRight" });
  fireEvent.keyDown(handle, { key: "ArrowLeft" });
  fireEvent.doubleClick(handle);

  expect(onCommit.mock.calls.map(([size]) => size)).toEqual([276, 244]);
  expect(onReset).toHaveBeenCalledOnce();
  expect(handle.getAttribute("aria-valuenow")).toBe("260");
});

test("the terminal handle grows with the up arrow", () => {
  const { handle, onCommit } = setup("horizontal", -1);

  fireEvent.keyDown(handle, { key: "ArrowUp" });

  expect(onCommit).toHaveBeenCalledWith(276);
});
