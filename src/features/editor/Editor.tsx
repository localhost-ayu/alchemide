import { EditorView } from "@codemirror/view";
import { useEffect, useRef } from "react";
import { useEditorStore } from "../../lib/editorStore";
import { createEditorState } from "./createEditorState";
import "./Editor.css";

export function Editor() {
  const active = useEditorStore((state) => state.active);
  const error = useEditorStore((state) => state.error);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) {
      return;
    }
    if (!viewRef.current) {
      viewRef.current = new EditorView({ parent: containerRef.current });
    }
    viewRef.current.setState(createEditorState(active));
  }, [active]);

  useEffect(() => {
    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, []);

  return (
    <div className="editor">
      {error && (
        <p role="alert" className="editor__error">
          {error}
        </p>
      )}
      {!active && <p className="editor__empty">Open a file from the explorer</p>}
      <div ref={containerRef} className="editor__view" hidden={!active} />
    </div>
  );
}
