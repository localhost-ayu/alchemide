import { fireEvent, render } from "@testing-library/react";
import { useState } from "react";
import { expect, test, vi } from "vitest";
import { useDismiss } from "./dismiss";

function Panel({ name, onClose }: { name: string; onClose: (name: string) => void }) {
  useDismiss(true, () => onClose(name));
  return <div>{name}</div>;
}

function Toggle({ onClose }: { onClose: () => void }) {
  const [open] = useState(false);
  useDismiss(open, onClose);
  return null;
}

test("Escape closes only the panel opened last, from anywhere in the window", () => {
  const closed: string[] = [];
  const { rerender } = render(
    <>
      <Panel name="settings" onClose={(name) => closed.push(name)} />
      <Panel name="palette" onClose={(name) => closed.push(name)} />
    </>,
  );

  fireEvent.keyDown(document.body, { key: "Escape" });
  expect(closed).toEqual(["palette"]);

  rerender(<Panel name="settings" onClose={(name) => closed.push(name)} />);
  fireEvent.keyDown(document.body, { key: "Escape" });
  expect(closed).toEqual(["palette", "settings"]);
});

test("leaves Escape alone when no panel is open", () => {
  const onClose = vi.fn();
  const editorKeys = vi.fn();
  render(<Toggle onClose={onClose} />);
  window.addEventListener("keydown", editorKeys);

  fireEvent.keyDown(document.body, { key: "Escape" });

  expect(onClose).not.toHaveBeenCalled();
  expect(editorKeys).toHaveBeenCalledOnce();
  window.removeEventListener("keydown", editorKeys);
});

test("ignores other keys", () => {
  const onClose = vi.fn();
  render(<Panel name="settings" onClose={onClose} />);

  fireEvent.keyDown(document.body, { key: "Enter" });

  expect(onClose).not.toHaveBeenCalled();
});
