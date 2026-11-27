import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { expect, test } from "vitest";
import { UNCOMMITTED } from "./blameText";
import { blameField, setBlame, showInlineBlame } from "./inlineBlame";

const hash = "b".repeat(40);
const blame = {
  commits: {
    [hash]: { author: "Pedro", time: Date.now() / 1000 - 3 * 86400, summary: "feat: echo" },
    [UNCOMMITTED]: { author: "Not Committed Yet", time: Date.now() / 1000, summary: "" },
  },
  lines: [UNCOMMITTED, hash],
};

function editor() {
  const state = EditorState.create({
    doc: "<?php\necho 1;",
    extensions: [blameField, showInlineBlame()],
  });
  return new EditorView({ state, parent: document.body });
}

const shown = (view: EditorView) => view.dom.querySelector(".cm-inline-blame")?.textContent ?? null;

test("follows the cursor line and hides while the text differs from the blamed file", () => {
  const view = editor();
  expect(shown(view)).toBeNull();

  view.dispatch({ effects: setBlame.of(blame) });
  expect(shown(view)).toBe("You, uncommitted");

  view.dispatch({ selection: { anchor: view.state.doc.line(2).from } });
  expect(shown(view)).toBe("Pedro, 3 days ago");

  view.dispatch({ changes: { from: 0, insert: "x" } });
  expect(shown(view)).toBeNull();

  view.dispatch({ effects: setBlame.of(blame) });
  expect(shown(view)).not.toBeNull();
  view.destroy();
});
