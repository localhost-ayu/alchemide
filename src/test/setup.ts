import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);

const emptyRects = () => Object.assign([], { item: () => null }) as unknown as DOMRectList;
const emptyRect = () => new DOMRect(0, 0, 0, 0);

if (!Range.prototype.getClientRects) {
  Range.prototype.getClientRects = emptyRects;
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
if (!Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = emptyRect;
}
