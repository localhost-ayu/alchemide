import { describe, expect, test } from "vitest";
import { detectLineEnding, joinLines } from "./lineEndings";

describe("detectLineEnding", () => {
  test("uses the first line break of the file", () => {
    expect(detectLineEnding("a\r\nb\nc")).toBe("CRLF");
    expect(detectLineEnding("a\nb\r\nc")).toBe("LF");
  });

  test("defaults to LF without line breaks", () => {
    expect(detectLineEnding("single line")).toBe("LF");
    expect(detectLineEnding("")).toBe("LF");
  });
});

test("joins lines with the chosen ending", () => {
  expect(joinLines(["a", "b", ""], "LF")).toBe("a\nb\n");
  expect(joinLines(["a", "b", ""], "CRLF")).toBe("a\r\nb\r\n");
});
