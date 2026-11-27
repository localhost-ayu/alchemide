import { ensureSyntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { expect, test } from "vitest";
import type { LanguageId } from "../../lib/languages";
import { languageSupport } from "./languageSupport";

function nodeNames(language: LanguageId, code: string): string[] {
  const state = EditorState.create({ doc: code, extensions: languageSupport(language) });
  const names: string[] = [];
  ensureSyntaxTree(state, state.doc.length, 1000)?.iterate({
    enter: (node) => {
      names.push(node.name);
    },
  });
  return names;
}

test.each<[LanguageId, string, string]>([
  ["rust", "fn main() { let x = 1; }", "FunctionItem"],
  ["python", "def mix(flask):\n    return flask\n", "FunctionDefinition"],
  ["go", "package main\nfunc main() {}\n", "FunctionDecl"],
])("parses %s", (language, code, node) => {
  expect(nodeNames(language, code)).toContain(node);
});
