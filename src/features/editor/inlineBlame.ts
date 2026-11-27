import { type EditorState, type Extension, StateEffect, StateField } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, WidgetType } from "@codemirror/view";
import type { Blame } from "../../lib/types";
import { blameLabel } from "./blameText";

type BlameState = { blame: Blame | null; stale: boolean };

export const setBlame = StateEffect.define<Blame | null>();

export const blameField = StateField.define<BlameState>({
  create: () => ({ blame: null, stale: false }),
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setBlame)) {
        return { blame: effect.value, stale: false };
      }
    }
    return transaction.docChanged ? { ...value, stale: true } : value;
  },
});

class BlameWidget extends WidgetType {
  constructor(
    readonly text: string,
    readonly title: string,
  ) {
    super();
  }

  eq(other: BlameWidget): boolean {
    return other.text === this.text && other.title === this.title;
  }

  toDOM(): HTMLElement {
    const span = document.createElement("span");
    span.className = "cm-inline-blame";
    span.textContent = this.text;
    span.title = this.title;
    return span;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

function decorate(state: EditorState): DecorationSet {
  const { blame, stale } = state.field(blameField);
  if (!blame || stale) {
    return Decoration.none;
  }
  const line = state.doc.lineAt(state.selection.main.head);
  const label = blameLabel(blame, line.number, Date.now() / 1000);
  if (!label) {
    return Decoration.none;
  }
  const widget = Decoration.widget({ widget: new BlameWidget(label.text, label.title), side: 1 });
  return Decoration.set([widget.range(line.to)]);
}

export function showInlineBlame(): Extension {
  return [
    EditorView.decorations.compute([blameField, "selection", "doc"], decorate),
    EditorView.baseTheme({
      ".cm-inline-blame": {
        marginLeft: "2.5em",
        color: "var(--color-faint)",
        fontStyle: "italic",
        fontSize: "0.9em",
        userSelect: "none",
      },
    }),
  ];
}
