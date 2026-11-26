import type { EditorState, Text } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useEffect, useRef, useState } from "react";
import { playfulTouchesEnabled, useActivityStore } from "../../lib/activityStore";
import { hasUnsavedTabs, selectActiveTab, useEditorStore } from "../../lib/editorStore";
import { onCloseRequested } from "../../lib/ipc";
import { joinLines } from "../../lib/lineEndings";
import { createEditorState } from "./createEditorState";
import { requestCloseTab } from "./requestCloseTab";
import { saveMessage } from "./saveMessage";
import { Tabs } from "./Tabs";
import "./Editor.css";

type Session = {
  state: EditorState;
  saved: Text;
};

function reportCursor(state: EditorState): void {
  const head = state.selection.main.head;
  const line = state.doc.lineAt(head);
  useEditorStore.getState().setCursor({
    line: line.number,
    column: head - line.from + 1,
    lineCount: state.doc.lines,
  });
}

export function Editor() {
  const activePath = useEditorStore((state) => state.activePath);
  const tabs = useEditorStore((state) => state.tabs);
  const error = useEditorStore((state) => state.error);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const sessionsRef = useRef(new Map<string, Session>());
  const experimentsRef = useRef(0);
  const [glow, setGlow] = useState<"a" | "b" | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const view = new EditorView({ parent: containerRef.current });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    const active = selectActiveTab(useEditorStore.getState());
    if (!view || !activePath || !active) {
      return;
    }
    const sessions = sessionsRef.current;
    let session = sessions.get(activePath);
    if (!session) {
      const path = activePath;
      const onUpdate = EditorView.updateListener.of((update) => {
        const current = sessions.get(path);
        if (!current) {
          return;
        }
        current.state = update.state;
        if (update.docChanged) {
          useEditorStore.getState().setDirty(path, !update.state.doc.eq(current.saved));
        }
        if (update.docChanged || update.selectionSet) {
          reportCursor(update.state);
        }
      });
      const state = createEditorState(active, onUpdate);
      session = { state, saved: state.doc };
      sessions.set(path, session);
    }
    view.setState(session.state);
    reportCursor(session.state);
  }, [activePath]);

  useEffect(() => {
    const open = new Set(tabs.map((tab) => tab.path));
    for (const path of sessionsRef.current.keys()) {
      if (!open.has(path)) {
        sessionsRef.current.delete(path);
      }
    }
  }, [tabs]);

  useEffect(() => {
    const save = async () => {
      const view = viewRef.current;
      const tab = selectActiveTab(useEditorStore.getState());
      const session = tab && sessionsRef.current.get(tab.path);
      if (!view || !tab || !session) {
        return;
      }
      const doc = view.state.doc;
      const { track, notify } = useActivityStore.getState();
      await track(
        useEditorStore.getState().saveFile(tab.path, joinLines(doc.toJSON(), tab.lineEnding)),
      );
      if (useEditorStore.getState().error) {
        return;
      }
      session.saved = doc;
      experimentsRef.current += 1;
      notify(saveMessage(tab.name, experimentsRef.current, playfulTouchesEnabled()));
      setGlow((current) => (current === "a" ? "b" : "a"));
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }
      const key = event.key.toLowerCase();
      const activePath = useEditorStore.getState().activePath;
      if (key === "s") {
        event.preventDefault();
        save();
      } else if (key === "w" && activePath) {
        event.preventDefault();
        requestCloseTab(activePath);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const subscription = onCloseRequested(
      () => !hasUnsavedTabs() || window.confirm("There are unsaved changes. Close anyway?"),
    );
    return () => {
      subscription.then((unsubscribe) => unsubscribe());
    };
  }, []);

  return (
    <div className="editor" data-glow={glow ?? undefined}>
      <Tabs />
      {error && (
        <p role="alert" className="editor__error">
          {error}
        </p>
      )}
      {!activePath && <p className="editor__empty">Open a file from the explorer</p>}
      <div ref={containerRef} className="editor__view" hidden={!activePath} />
    </div>
  );
}
