import { snippet } from "@codemirror/autocomplete";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { expect, test } from "vitest";
import { snippetVariables, toTemplate } from "../snippets";
import { SNIPPET_PACKS } from ".";

const variables = snippetVariables(
  "/lab/app/UserController.php",
  "php",
  new Date(2026, 0, 1),
  () => "uuid",
);

test.each(SNIPPET_PACKS.map((pack) => [pack.id, pack] as const))("%s pack is usable", (_, pack) => {
  expect(pack.snippets.length).toBeGreaterThan(5);
  const prefixes = pack.snippets.flatMap((item) => item.prefixes);
  expect(new Set(prefixes).size).toBe(prefixes.length);
  for (const item of pack.snippets) {
    expect(item.languages).not.toHaveLength(0);
    const view = new EditorView({ state: EditorState.create({ doc: "" }) });
    snippet(toTemplate(item.body, variables))(view, { label: item.name }, 0, 0);
    const text = view.state.doc.toString();
    expect(text, item.name).not.toMatch(/\$\{\d|\\[{}]/);
    expect(text.length, item.name).toBeGreaterThan(0);
    view.destroy();
  }
});

test("PHP snippets keep variables as text and fill tab stops", () => {
  const foreach = SNIPPET_PACKS.find((pack) => pack.id === "php")?.snippets.find(
    (item) => item.name === "Foreach",
  );
  const view = new EditorView({ state: EditorState.create({ doc: "" }) });
  snippet(toTemplate(foreach?.body ?? "", variables))(view, { label: "foreach" }, 0, 0);

  expect(view.state.doc.toString()).toBe("foreach ($items as $item) {\n  \n}");
  expect(view.state.sliceDoc(view.state.selection.main.from, view.state.selection.main.to)).toBe(
    "items",
  );
  view.destroy();
});

test("class snippets use the file name", () => {
  const controller = SNIPPET_PACKS.find((pack) => pack.id === "laravel")?.snippets.find(
    (item) => item.name === "Controller",
  );
  const view = new EditorView({ state: EditorState.create({ doc: "" }) });
  snippet(toTemplate(controller?.body ?? "", variables))(view, { label: "c" }, 0, 0);

  expect(view.state.doc.toString()).toContain("namespace App\\Http\\Controllers;");
  expect(view.state.doc.toString()).toContain("class UserController extends Controller");
  view.destroy();
});

function expand(packId: string, name: string): string {
  const item = SNIPPET_PACKS.find((pack) => pack.id === packId)?.snippets.find(
    (candidate) => candidate.name === name,
  );
  const view = new EditorView({ state: EditorState.create({ doc: "" }) });
  snippet(toTemplate(item?.body ?? "", variables))(view, { label: name }, 0, 0);
  const text = view.state.doc.toString();
  view.destroy();
  return text;
}

test("SQL snippets expand for SQL files", () => {
  expect(expand("sql", "Select")).toBe("SELECT *\nFROM table\nWHERE condition;");
  const sql = SNIPPET_PACKS.find((pack) => pack.id === "sql");
  expect(sql?.snippets.every((item) => item.languages.includes("sql"))).toBe(true);
});

test("SQL Server snippets keep @ and # names", () => {
  expect(expand("sqlserver", "Last hours")).toBe("DATEADD(hour, -48, GETDATE())");
  expect(expand("sqlserver", "Variable")).toBe("DECLARE @name INT = 0;");
  expect(expand("sqlserver", "Temp table")).toContain("INTO #temp");
  expect(expand("sqlserver", "Try catch")).toContain("IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;");
});
