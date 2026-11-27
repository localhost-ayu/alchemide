import { expect, test } from "vitest";
import type { Branch } from "../../lib/types";
import { branchOptions, localName } from "./branchOptions";

const branch = (name: string, remote = false): Branch => ({
  name,
  current: false,
  remote,
  author: "Ana",
  time: 0,
  subject: "feat: x",
});

const branches = [branch("main"), branch("feature/login"), branch("origin/feature/us1", true)];

test("filters by name and offers to create a branch that does not exist", () => {
  expect(branchOptions(branches, "").map((o) => o.kind)).toEqual(["branch", "branch", "branch"]);
  const login = branchOptions(branches, "login");
  expect(login[0]).toEqual({ kind: "create", name: "login" });
  expect(login.slice(1).map((o) => (o.kind === "branch" ? o.branch.name : ""))).toEqual([
    "feature/login",
  ]);
  expect(branchOptions(branches, "main").map((o) => o.kind)).toEqual(["branch"]);
});

test("a remote branch switches to its local name", () => {
  expect(localName(branch("origin/feature/us1", true))).toBe("feature/us1");
  expect(localName(branch("main"))).toBe("main");
});
