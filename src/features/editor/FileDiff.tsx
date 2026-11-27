import { syntaxHighlighting } from "@codemirror/language";
import { MergeView, unifiedMergeView } from "@codemirror/merge";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, lineNumbers } from "@codemirror/view";
import { useEffect, useRef } from "react";
import { languageForPath } from "../../lib/languages";
import { editorTheme } from "./editorTheme";
import { highlightStyle } from "./highlightStyle";
import { languageSupport } from "./languageSupport";
import type { DiffLayout } from "./useChangesStore";

type FileDiffProps = {
  path: string;
  before: string;
  after: string;
  layout: DiffLayout;
};

const COLLAPSE = { margin: 3, minSize: 6 };

function readOnly(path: string): Extension {
  return [
    lineNumbers(),
    languageSupport(languageForPath(path)),
    syntaxHighlighting(highlightStyle),
    editorTheme,
    EditorState.readOnly.of(true),
    EditorView.editable.of(false),
  ];
}

export function FileDiff({ path, before, after, layout }: FileDiffProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) {
      return;
    }
    const extensions = readOnly(path);
    const view =
      layout === "split"
        ? new MergeView({
            a: { doc: before, extensions },
            b: { doc: after, extensions },
            parent,
            collapseUnchanged: COLLAPSE,
            gutter: true,
          })
        : new EditorView({
            parent,
            state: EditorState.create({
              doc: after,
              extensions: [
                extensions,
                unifiedMergeView({
                  original: before,
                  mergeControls: false,
                  collapseUnchanged: COLLAPSE,
                }),
              ],
            }),
          });
    return () => view.destroy();
  }, [path, before, after, layout]);

  return <div ref={containerRef} className="file-diff" data-layout={layout} />;
}
