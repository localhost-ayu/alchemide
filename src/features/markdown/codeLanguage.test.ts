import { expect, test } from "vitest";
import { codeLanguage } from "./codeLanguage";

test.each([
  ["language-ts", "typescript"],
  ["language-TSX", "tsx"],
  ["language-bash", "shellscript"],
  ["language-yml", "yaml"],
  ["hljs language-php", "php"],
])("reads %s as %s", (className, language) => {
  expect(codeLanguage(className)).toBe(language);
});

test("returns null for unknown or missing languages", () => {
  expect(codeLanguage("language-cobol")).toBeNull();
  expect(codeLanguage(undefined)).toBeNull();
  expect(codeLanguage("not-a-language")).toBeNull();
});
