import type { EditorState, Text } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useEffect, useRef, useState } from "react";
import { playfulTouchesEnabled, useActivityStore } from "../../lib/activityStore";
import { registerCommands } from "../../lib/commands";
import { useEditorSettings } from "../../lib/editorSettings";
import { hasUnsavedTabs, selectActiveTab, type Tab, useEditorStore } from "../../lib/editorStore";
import { onCloseRequested } from "../../lib/ipc";
import { joinLines } from "../../lib/lineEndings";
import { createEditorState, indentation, indentationFor } from "./createEditorState";
import { requestCloseTab } from "./requestCloseTab";
import { saveMessage } from "./saveMessage";
import { Tabs } from "./Tabs";
import "./Editor.css";

type Session = {
  state: EditorState;
  saved: Text;
  revision: number;
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
    const reportScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = view.scrollDOM;
      const room = scrollHeight - clientHeight;
      useEditorStore.getState().setScroll(room > 0 ? scrollTop / room : 0);
    };
    view.scrollDOM.addEventListener("scroll", reportScroll, { passive: true });
    return () => {
      view.scrollDOM.removeEventListener("scroll", reportScroll);
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  const createSession = (tab: Tab): Session => {
    const sessions = sessionsRef.current;
    const path = tab.path;
    const tracksDraft = tab.language === "markdown";
    const onUpdate = EditorView.updateListener.of((update) => {
      const current = sessions.get(path);
      if (!current) {
        return;
      }
      current.state = update.state;
      if (update.docChanged) {
        useEditorStore.getState().setDirty(path, !update.state.doc.eq(current.saved));
        if (tracksDraft) {
          useEditorStore.getState().setDraft(path, update.state.doc.toString());
        }
      }
      if (update.docChanged || update.selectionSet) {
        reportCursor(update.state);
      }
    });
    const state = createEditorState(tab, onUpdate, useEditorSettings.getState().tabSize);
    const session = { state, saved: state.doc, revision: tab.revision };
    sessions.set(path, session);
    return session;
  };
  const createSessionRef = useRef(createSession);
  createSessionRef.current = createSession;

  useEffect(() => {
    const view = viewRef.current;
    const active = selectActiveTab(useEditorStore.getState());
    if (!view || !activePath || !active) {
      return;
    }
    const session = sessionsRef.current.get(activePath) ?? createSessionRef.current(active);
    view.setState(session.state);
    reportCursor(session.state);
  }, [activePath]);

  useEffect(() => {
    const view = viewRef.current;
    for (const tab of tabs) {
      const session = sessionsRef.current.get(tab.path);
      if (!session || session.revision === tab.revision) {
        continue;
      }
      const fresh = createSessionRef.current(tab);
      if (view && tab.path === useEditorStore.getState().activePath) {
        view.setState(fresh.state);
        reportCursor(fresh.state);
      }
    }
  }, [tabs]);

  const tabSize = useEditorSettings((state) => state.tabSize);
  useEffect(() => {
    const effects = indentation.reconfigure(indentationFor(tabSize));
    for (const session of sessionsRef.current.values()) {
      session.state = session.state.update({ effects }).state;
    }
    viewRef.current?.dispatch({ effects });
  }, [tabSize]);

  const reveal = useEditorStore((state) => state.reveal);
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !reveal || reveal.path !== activePath) {
      return;
    }
    const line = view.state.doc.line(Math.min(Math.max(reveal.line, 1), view.state.doc.lines));
    view.dispatch({
      selection: { anchor: line.from },
      effects: EditorView.scrollIntoView(line.from, { y: "center" }),
    });
    view.focus();
  }, [reveal, activePath]);

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
    return registerCommands([
      { id: "editor.save", title: "Save file", keys: "Ctrl+S", run: save },
      {
        id: "editor.closeTab",
        title: "Close tab",
        keys: "Ctrl+W",
        run: () => {
          const activePath = useEditorStore.getState().activePath;
          if (activePath) {
            requestCloseTab(activePath);
          }
        },
      },
    ]);
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
