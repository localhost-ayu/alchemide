import { expect, test } from "vitest";
import { changeLabel, classifyDiffLine } from "./diffLines";

test.each([
  ["diff --git a/x b/x", "meta"],
  ["index 1a2b..3c4d 100644", "meta"],
  ["--- a/x", "meta"],
  ["+++ b/x", "meta"],
  ["new file mode 100644", "meta"],
  ["@@ -1,2 +1,3 @@ function", "hunk"],
  ["+added", "added"],
  ["-removed", "removed"],
  [" unchanged", "context"],
  ["", "context"],
])("classifies %j as %s", (line, kind) => {
  expect(classifyDiffLine(line)).toBe(kind);
});

test("names each git status code", () => {
  expect(changeLabel("M")).toBe("modified");
  expect(changeLabel("?")).toBe("untracked");
  expect(changeLabel(null)).toBe("");
});
