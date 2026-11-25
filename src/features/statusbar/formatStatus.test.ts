import { expect, test } from "vitest";
import { formatEncoding, formatLineCount, formatPosition } from "./formatStatus";

test("formats the cursor position", () => {
  expect(formatPosition({ line: 12, column: 5, lineCount: 40 })).toBe("Ln 12, Col 5");
});

test("formats the line count in singular and plural", () => {
  expect(formatLineCount(1)).toBe("1 line");
  expect(formatLineCount(0)).toBe("0 lines");
  expect(formatLineCount(1234)).toBe("1234 lines");
});

test("names the encoding with or without BOM", () => {
  expect(formatEncoding(false)).toBe("UTF-8");
  expect(formatEncoding(true)).toBe("UTF-8 with BOM");
});
