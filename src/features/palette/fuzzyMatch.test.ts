import { expect, test } from "vitest";
import { fuzzyMatch, rankByFuzzy } from "./fuzzyMatch";

test("matches letters in order, ignoring case and spaces", () => {
  expect(fuzzyMatch("tgl term", "Toggle terminal")?.indices).toEqual([0, 2, 4, 7, 8, 9, 10]);
  expect(fuzzyMatch("TT", "Toggle terminal")).not.toBeNull();
  expect(fuzzyMatch("xyz", "Toggle terminal")).toBeNull();
  expect(fuzzyMatch("lt", "Toggle")).toBeNull();
});

test("everything matches an empty query", () => {
  expect(fuzzyMatch("", "anything")).toEqual({ score: 0, indices: [] });
});

test("prefers word starts and consecutive letters", () => {
  const ranked = rankByFuzzy("app", ["src/mapping.ts", "src/app/App.tsx", "a/p/p.ts"], (x) => x);
  expect(ranked[0]).toBe("src/app/App.tsx");
});

test("finds files by the initials of their path", () => {
  const files = ["src/features/editor/Editor.tsx", "src/features/explorer/Explorer.tsx"];
  expect(rankByFuzzy("fexp", files, (x) => x)).toEqual(["src/features/explorer/Explorer.tsx"]);
});
