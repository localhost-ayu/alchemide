import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, test } from "vitest";
import { isOutside, setCloseOnOutsideClick, useDismiss } from "./dismiss";

function Panel() {
  const [open, setOpen] = useState(true);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <>
      <button type="button">outside</button>
      {open && (
        <div ref={ref} role="dialog" aria-label="Panel">
          <button type="button">inside</button>
        </div>
      )}
    </>
  );
}

afterEach(() => setCloseOnOutsideClick(false));

test("tells clicks inside a panel from clicks outside it", () => {
  const panel = document.createElement("div");
  const child = document.createElement("span");
  panel.append(child);
  expect(isOutside(panel, child)).toBe(false);
  expect(isOutside(panel, document.body)).toBe(true);
  expect(isOutside(null, document.body)).toBe(false);
});

test("an outside click does nothing while the option is off", () => {
  render(<Panel />);
  fireEvent.pointerDown(screen.getByRole("button", { name: "outside" }));
  expect(screen.getByRole("dialog", { name: "Panel" })).toBeTruthy();
});

test("an outside click closes the panel when the option is on", () => {
  setCloseOnOutsideClick(true);
  render(<Panel />);

  fireEvent.pointerDown(screen.getByRole("button", { name: "inside" }));
  expect(screen.getByRole("dialog", { name: "Panel" })).toBeTruthy();

  act(() => {
    fireEvent.pointerDown(screen.getByRole("button", { name: "outside" }));
  });
  expect(screen.queryByRole("dialog", { name: "Panel" })).toBeNull();
});
