import { beforeEach, expect, test } from "vitest";
import { loadSettings, saveSettings, setMockSnippets } from "./ipc.mock";
import { DEFAULT_PACKS } from "./snippetPacks";
import { readEnabledPacks, useSnippetStore } from "./snippetStore";
import { snippetsFor } from "./snippets";

beforeEach(async () => {
  await saveSettings({});
  setMockSnippets([], null);
  await useSnippetStore.getState().load();
});

test("enables the language packs by default and drops unknown ids", () => {
  expect(readEnabledPacks(undefined)).toEqual(DEFAULT_PACKS);
  expect(readEnabledPacks({ packs: ["laravel", "nope", 3] })).toEqual(["laravel"]);
  expect(readEnabledPacks({ packs: [] })).toEqual([]);
});

test("loads the user's snippet files and reports broken ones", async () => {
  setMockSnippets(
    [
      { file: "php.json", content: '{ "Mine": { "prefix": "mine", "body": "mine();" } }' },
      { file: "broken.json", content: "{" },
    ],
    null,
  );

  await useSnippetStore.getState().load();

  const { userSnippets, problems, snippets } = useSnippetStore.getState();
  expect(userSnippets.map((item) => item.name)).toEqual(["Mine"]);
  expect(problems).toEqual(["broken.json is not valid JSON"]);
  expect(snippetsFor("php", snippets)[0]?.name).toBe("Mine");
});

test("turning a pack on and off saves the choice", async () => {
  await saveSettings({ theme: "Maré" });

  await useSnippetStore.getState().setPack("laravel", true);
  await useSnippetStore.getState().setPack("php", false);

  const { enabledPacks, snippets } = useSnippetStore.getState();
  expect(enabledPacks).toContain("laravel");
  expect(enabledPacks).not.toContain("php");
  expect(snippets.some((item) => item.prefixes.includes("lr-route"))).toBe(true);
  expect(snippets.some((item) => item.prefixes.includes("foreachk"))).toBe(false);
  expect(await loadSettings()).toEqual({ theme: "Maré", snippets: { packs: enabledPacks } });
});

test("imports VS Code snippets once", async () => {
  setMockSnippets([], [{ file: "go.json", content: '{ "X": { "prefix": "x", "body": "x" } }' }]);

  expect(await useSnippetStore.getState().importFromVscode()).toEqual({ copied: 1, found: true });
  expect(await useSnippetStore.getState().importFromVscode()).toEqual({ copied: 0, found: true });
  expect(useSnippetStore.getState().userSnippets.map((item) => item.name)).toEqual(["X"]);
});
