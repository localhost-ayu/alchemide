import { expect, test } from "vitest";
import { parseJsonc } from "./jsonc";

test("parses plain JSON", () => {
  expect(parseJsonc('{"a": [1, 2]}')).toEqual({ a: [1, 2] });
});

test("ignores line and block comments outside strings", () => {
  const text = [
    "// header",
    "{",
    '  /* block */ "url": "https://example.com/*not*/", // trailing',
    '  "path": "C:\\\\dev\\\\//x"',
    "}",
  ].join("\n");
  expect(parseJsonc(text)).toEqual({ url: "https://example.com/*not*/", path: "C:\\dev\\//x" });
});

test("accepts trailing commas and a byte order mark", () => {
  expect(parseJsonc('\uFEFF{"a": [1, 2,], "b": {"c": 3,},}')).toEqual({ a: [1, 2], b: { c: 3 } });
});

test("keeps commas inside strings", () => {
  expect(parseJsonc('{"a": ",}"}')).toEqual({ a: ",}" });
});

test("still rejects broken JSON", () => {
  expect(() => parseJsonc("{ nope }")).toThrow();
});
