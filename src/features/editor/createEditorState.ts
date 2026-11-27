import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import {
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
} from "@codemirror/language";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
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
import { blameField, showInlineBlame } from "./inlineBlame";
import { languageSupport } from "./languageSupport";
import { snippetCompletion } from "./snippetCompletion";

export const indentation = new Compartment();
export const languageServer = new Compartment();
export const inlineBlame = new Compartment();

export function indentationFor(tabSize: number): Extension {
  return [EditorState.tabSize.of(tabSize), indentUnit.of(" ".repeat(tabSize))];
}

export function createEditorState(
  file: Tab,
  onUpdate: Extension,
  tabSize: number,
  showBlame = false,
): EditorState {
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
      snippetCompletion(file.path, file.language),
      indentation.of(indentationFor(tabSize)),
      languageServer.of([]),
      blameField,
      inlineBlame.of(showBlame ? showInlineBlame() : []),
      editorTheme,
      EditorView.contentAttributes.of({ "aria-label": `Editing ${file.name}` }),
      onUpdate,
    ],
  });
}
