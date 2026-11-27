import { expect, test, vi } from "vitest";

const calls: Record<string, unknown>[] = [];

vi.mock("shiki/core", () => ({
  createCssVariablesTheme: () => ({ name: "alchemide" }),
  createHighlighterCore: async () => ({
    getLoadedLanguages: () => ["typescript"],
    loadLanguage: async () => {},
    codeToTokens: (_code: string, options: Record<string, unknown>) => {
      calls.push(options);
      return { tokens: [] };
    },
  }),
}));

vi.mock("shiki/engine/javascript", () => ({ createJavaScriptRegexEngine: () => ({}) }));

test("gives the first line enough time to compile the grammar on a busy machine", async () => {
  const { tokenize, TOKENIZE_TIME_LIMIT_MS } = await import("./highlighter");

  await tokenize('const flask = "ready";', "typescript");

  expect(TOKENIZE_TIME_LIMIT_MS).toBeGreaterThanOrEqual(5000);
  expect(calls[0]).toMatchObject({ tokenizeTimeLimit: TOKENIZE_TIME_LIMIT_MS });
});
