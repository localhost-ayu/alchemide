import { expect, test } from "vitest";
import { parentOf } from "./useWorkspaceStore";

test("finds the loaded folder that lists a path", () => {
  const children = {
    "/p": [{ name: "src", path: "/p/src", isDir: true }],
    "/p/src": [{ name: "a.ts", path: "/p/src/a.ts", isDir: false }],
  };
  expect(parentOf(children, "/p/src/a.ts")).toBe("/p/src");
  expect(parentOf(children, "/p/src")).toBe("/p");
  expect(parentOf(children, "/elsewhere")).toBeNull();
});
