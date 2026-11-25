import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { EditorState, type Extension } from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import type { Tab } from "../../lib/editorStore";
import { editorTheme } from "./editorTheme";
import { highlightStyle } from "./highlightStyle";
import { languageSupport } from "./languageSupport";

export function createEditorState(file: Tab, onUpdate: Extension): EditorState {
  return EditorState.create({
    doc: file.text,
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      bracketMatching(),
      highlightActiveLine(),
      syntaxHighlighting(highlightStyle),
      keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap, indentWithTab]),
      languageSupport(file.language),
      editorTheme,
      EditorView.contentAttributes.of({ "aria-label": `Editing ${file.name}` }),
      onUpdate,
    ],
  });
}
