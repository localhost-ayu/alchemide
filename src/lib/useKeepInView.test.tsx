import { render } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useKeepInView } from "./useKeepInView";

function List({ highlighted }: { highlighted?: string }) {
  useKeepInView(highlighted);
  return (
    <ul>
      <li id="first">first</li>
      <li id="second">second</li>
    </ul>
  );
}

afterEach(() => vi.restoreAllMocks());

test("scrolls the highlighted element into view, only as far as needed", () => {
  const scroll = vi.spyOn(Element.prototype, "scrollIntoView");
  const { rerender } = render(<List highlighted="first" />);

  rerender(<List highlighted="second" />);

  expect(scroll).toHaveBeenCalledTimes(2);
  expect(scroll.mock.contexts.map((element) => (element as Element).id)).toEqual([
    "first",
    "second",
  ]);
  expect(scroll).toHaveBeenLastCalledWith({ block: "nearest" });
});

test("does nothing without a highlighted element", () => {
  const scroll = vi.spyOn(Element.prototype, "scrollIntoView");

  render(<List />);

  expect(scroll).not.toHaveBeenCalled();
});
