import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import { useEditorStore } from "../../lib/editorStore";
import { readMockFile } from "../../lib/ipc.mock";
import type { SearchMatch } from "../../lib/types";
import {
  connectSearchEvents,
  groupByFile,
  matchKey,
  replaceTargets,
  useSearchStore,
} from "./useSearchStore";

const root = "/home/user/sample-project";

const match = (path: string, line: number): SearchMatch => ({
  path: `${root}/${path}`,
  relative: path,
  line,
  preview: "",
  ranges: [],
});

let disconnect = () => {};
beforeAll(() => {
  disconnect = connectSearchEvents();
});
afterAll(() => disconnect());

beforeEach(() => {
  useSearchStore.setState({
    results: [],
    excluded: {},
    status: "idle",
    error: null,
    replacement: "",
  });
  useEditorStore.setState({ tabs: [] });
});

test("groups matches by file in order", () => {
  const groups = groupByFile([match("a.ts", 1), match("b.ts", 4), match("a.ts", 9)]);
  expect(groups.map((group) => [group.relative, group.matches.map((m) => m.line)])).toEqual([
    ["a.ts", [1, 9]],
    ["b.ts", [4]],
  ]);
});

test("replaces only selected lines and skips files with unsaved changes", () => {
  const matches = [match("a.ts", 1), match("a.ts", 9), match("b.ts", 4), match("c.ts", 2)];
  const excluded = {
    [matchKey(match("a.ts", 9))]: true as const,
    [matchKey(match("c.ts", 2))]: true as const,
  };

  const { targets, skipped } = replaceTargets(matches, excluded, new Set([`${root}/b.ts`]));

  expect(targets).toEqual([{ path: `${root}/a.ts`, lines: [1] }]);
  expect(skipped).toEqual(["b.ts"]);
});

test("searches, then replaces the selected matches on disk", async () => {
  const store = useSearchStore.getState();
  store.setQuery({ text: "sample", regex: false, caseSensitive: false });
  await store.run();
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(useSearchStore.getState().results.map((m) => m.relative)).toEqual([
    "README.md",
    "package.json",
  ]);
  useSearchStore.getState().toggleMatch(useSearchStore.getState().results[1] as SearchMatch);
  useSearchStore.getState().setReplacement("demo");

  const outcome = await useSearchStore.getState().replaceSelected();

  expect(outcome).toEqual({ files: 1, replacements: 1, skipped: [] });
  expect(readMockFile(`${root}/README.md`)?.startsWith("# demo project")).toBe(true);
  expect(readMockFile(`${root}/package.json`)).toContain("sample-project");
});
