import { expect, test } from "vitest";
import { blameLabel, timeAgo, UNCOMMITTED } from "./blameText";

const now = 1_800_000_000;

test.each([
  [now, "just now"],
  [now - 59, "just now"],
  [now - 60, "1 minute ago"],
  [now - 3 * 3600, "3 hours ago"],
  [now - 24 * 3600, "1 day ago"],
  [now - 10 * 30 * 24 * 3600, "10 months ago"],
  [now - 2 * 365 * 24 * 3600, "2 years ago"],
  [now + 500, "just now"],
])("timeAgo(%i) is %s", (time, text) => {
  expect(timeAgo(time, now)).toBe(text);
});

test("labels a committed line, an uncommitted one and a line without blame", () => {
  const hash = "a".repeat(40);
  const blame = {
    commits: {
      [hash]: { author: "Pedro", time: now - 10 * 30 * 24 * 3600, summary: "feat: echo" },
      [UNCOMMITTED]: { author: "Not Committed Yet", time: now, summary: "" },
    },
    lines: [hash, UNCOMMITTED],
  };
  expect(blameLabel(blame, 1, now)).toEqual({
    text: "Pedro, 10 months ago",
    title: "aaaaaaa feat: echo",
  });
  expect(blameLabel(blame, 2, now)?.text).toBe("You, uncommitted");
  expect(blameLabel(blame, 3, now)).toBeNull();
});
