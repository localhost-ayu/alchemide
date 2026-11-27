import { expect, test } from "vitest";
import {
  languagesFromScope,
  readSnippetFile,
  snippetsFor,
  snippetVariables,
  toTemplate,
} from "./snippets";

test("maps VS Code language ids to editor languages", () => {
  expect(languagesFromScope("typescriptreact, javascriptreact")).toEqual(["tsx", "jsx"]);
  expect(languagesFromScope("blade,php")).toEqual(["php"]);
  expect(languagesFromScope("cobol")).toEqual([]);
});

test("reads a per-language snippet file with comments", () => {
  const content = `{
    // PHP helpers
    "Dump and die": {
      "prefix": ["dd", "dump"],
      "body": ["dd(\${1:\\\\$var});", "$0"],
      "description": "Dump a variable",
    },
    "Broken": { "body": "no prefix" }
  }`;

  const { snippets, problem } = readSnippetFile("php.json", content);

  expect(problem).toBeNull();
  expect(snippets).toEqual([
    {
      name: "Dump and die",
      prefixes: ["dd", "dump"],
      body: "dd(${1:\\$var});\n$0",
      description: "Dump a variable",
      languages: ["php"],
    },
  ]);
});

test("reads scopes from .code-snippets files", () => {
  const content = JSON.stringify({
    Log: { prefix: "log", body: "console.log($1);", scope: "javascript,typescript" },
    Todo: { prefix: "todo", body: "TODO: $1" },
  });

  const { snippets } = readSnippetFile("mine.code-snippets", content);

  expect(snippets.map((snippet) => snippet.languages)).toEqual([
    ["javascript", "typescript"],
    "all",
  ]);
  expect(snippetsFor("python", snippets).map((snippet) => snippet.name)).toEqual(["Todo"]);
  expect(snippetsFor("typescript", snippets)).toHaveLength(2);
});

test("reports broken files and unknown languages", () => {
  expect(readSnippetFile("php.json", "{ nope").problem).toBe("php.json is not valid JSON");
  expect(readSnippetFile("cobol.json", "{}").problem).toBe("cobol.json: unknown language");
});

test("turns VS Code tab stops into CodeMirror fields", () => {
  expect(toTemplate("for ($1; $2) {\n\t$0\n}", {})).toBe("for (${1}; ${2}) \\{\n\t${0}\n\\}");
  expect(toTemplate("${1:name} = ${2:value}", {})).toBe("${1:name} = ${2:value}");
});

test("flattens nested placeholders and picks the first choice", () => {
  expect(toTemplate("${1:new ${2:Thing}()}", {})).toBe("${1:new Thing()}");
  expect(toTemplate("${1|public,private|} function", {})).toBe("${1:public} function");
});

test("keeps escaped and literal dollars and braces as text", () => {
  expect(toTemplate("\\$this->${1:name}", {})).toBe("$this->${1:name}");
  expect(toTemplate("`\\${x}`", {})).toBe("`$\\{x\\}`");
  expect(toTemplate("`${x}`", {})).toBe("`${x}`");
});

test("drops defaults that CodeMirror fields cannot hold", () => {
  expect(toTemplate("${1:{ a: 1 \\}}", {})).toBe("${1}");
});

test("resolves variables and turns unknown ones into named fields", () => {
  const variables = { TM_FILENAME_BASE: "UserController" };
  expect(toTemplate("class $TM_FILENAME_BASE", variables)).toBe("class UserController");
  expect(toTemplate("${TM_FILENAME_BASE/(.*)Controller/$1/}", variables)).toBe("User");
  expect(toTemplate("${TM_FILENAME_BASE/(.*)/${1:/downcase}s/}", variables)).toBe(
    "usercontrollers",
  );
  expect(toTemplate("${TM_FILENAME_BASE/(.*)/${1:/camelcase}/}", variables)).toBe("userController");
  expect(toTemplate("${MISSING:fallback}", variables)).toBe("fallback");
  expect(toTemplate("$MISSING", variables)).toBe("${MISSING}");
});

test("computes file, date and comment variables", () => {
  const now = new Date(2026, 10, 26, 9, 5, 7);
  const variables = snippetVariables(
    "C:\\lab\\app\\Http\\UserController.php",
    "php",
    now,
    () => "uuid-1",
  );

  expect(variables).toMatchObject({
    TM_FILENAME: "UserController.php",
    TM_FILENAME_BASE: "UserController",
    TM_DIRECTORY: "C:\\lab\\app\\Http",
    CURRENT_YEAR: "2026",
    CURRENT_MONTH: "11",
    CURRENT_DATE: "26",
    CURRENT_HOUR: "09",
    CURRENT_MINUTE: "05",
    CURRENT_MONTH_NAME: "November",
    UUID: "uuid-1",
    LINE_COMMENT: "//",
  });
  expect(snippetVariables("/lab/main.py", "python", now, () => "x").LINE_COMMENT).toBe("#");
});
