import type { EditorState, Text } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useEffect, useRef, useState } from "react";
import { playfulTouchesEnabled, useActivityStore } from "../../lib/activityStore";
import { registerCommands } from "../../lib/commands";
import { useEditorSettings } from "../../lib/editorSettings";
import { hasUnsavedTabs, selectActiveTab, type Tab, useEditorStore } from "../../lib/editorStore";
import { t as translateNow, useT } from "../../lib/i18n";
import { gitBlame, onCloseRequested, onWorkspaceChange, pickFile } from "../../lib/ipc";
import { useLanguageServerStore } from "../../lib/languageServerStore";
import { joinLines } from "../../lib/lineEndings";
import { ChangesView } from "./ChangesView";
import {
  createEditorState,
  indentation,
  indentationFor,
  inlineBlame,
  languageServer,
} from "./createEditorState";
import { setShowFile } from "./editorWorkspace";
import { setBlame, showInlineBlame } from "./inlineBlame";
import { languageServerExtension, stopLanguageServers } from "./languageServers";
import { requestCloseTab } from "./requestCloseTab";
import { saveMessage } from "./saveMessage";
import { Tabs } from "./Tabs";
import { useChangesStore } from "./useChangesStore";
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
  const t = useT();
  const changesOpen = useChangesStore((state) => state.open);
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

  const attachLanguageServer = async (tab: Tab) => {
    const extension = await languageServerExtension(tab.path, tab.language);
    const session = sessionsRef.current.get(tab.path);
    if (!session) {
      return;
    }
    const effects = languageServer.reconfigure(extension ?? []);
    const view = viewRef.current;
    if (view && view.state === session.state) {
      view.dispatch({ effects });
      return;
    }
    session.state = session.state.update({ effects }).state;
  };
  const attachRef = useRef(attachLanguageServer);
  attachRef.current = attachLanguageServer;

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
    const { tabSize, inlineBlame: showBlame } = useEditorSettings.getState();
    const state = createEditorState(tab, onUpdate, tabSize, showBlame);
    const session = { state, saved: state.doc, revision: tab.revision };
    sessions.set(path, session);
    void attachRef.current(tab);
    return session;
  };
  const createSessionRef = useRef(createSession);
  createSessionRef.current = createSession;

  useEffect(() => {
    if (activePath) {
      useChangesStore.getState().hide();
    }
  }, [activePath]);

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

  const showBlame = useEditorSettings((state) => state.inlineBlame);
  useEffect(() => {
    const effects = inlineBlame.reconfigure(showBlame ? showInlineBlame() : []);
    for (const session of sessionsRef.current.values()) {
      session.state = session.state.update({ effects }).state;
    }
    viewRef.current?.dispatch({ effects });
  }, [showBlame]);

  const activeDirty = useEditorStore((state) => selectActiveTab(state)?.dirty ?? false);
  useEffect(() => {
    if (!showBlame || !activePath || activeDirty) {
      return;
    }
    let current = true;
    gitBlame(activePath)
      .then((blame) => {
        const session = sessionsRef.current.get(activePath);
        if (!current || !session) {
          return;
        }
        const effects = setBlame.of(blame);
        const view = viewRef.current;
        if (view && view.state === session.state) {
          view.dispatch({ effects });
        } else {
          session.state = session.state.update({ effects }).state;
        }
      })
      .catch(() => undefined);
    return () => {
      current = false;
    };
  }, [showBlame, activePath, activeDirty]);

  const tabSize = useEditorSettings((state) => state.tabSize);
  useEffect(() => {
    const effects = indentation.reconfigure(indentationFor(tabSize));
    for (const session of sessionsRef.current.values()) {
      session.state = session.state.update({ effects }).state;
    }
    viewRef.current?.dispatch({ effects });
  }, [tabSize]);

  useEffect(() => {
    setShowFile(async (path) => {
      await useEditorStore.getState().openFile(path);
      for (let frame = 0; frame < 30; frame++) {
        const view = viewRef.current;
        const session = sessionsRef.current.get(path);
        if (view && session && view.state === session.state) {
          return view;
        }
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      return null;
    });
    return () => setShowFile(null);
  }, []);

  const generation = useLanguageServerStore((state) => state.generation);
  useEffect(() => {
    if (generation === 0) {
      return;
    }
    for (const tab of useEditorStore.getState().tabs) {
      if (sessionsRef.current.has(tab.path)) {
        void attachRef.current(tab);
      }
    }
  }, [generation]);

  useEffect(() => {
    const subscription = onWorkspaceChange(() => {
      void stopLanguageServers();
    });
    return () => {
      subscription.then((unsubscribe) => unsubscribe());
    };
  }, []);

  useEffect(
    () =>
      registerCommands([
        {
          id: "editor.restartLanguageServers",
          title: t("editor.restartServers"),
          run: () => {
            void stopLanguageServers();
          },
        },
      ]),
    [t],
  );

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
      {
        id: "editor.showChanges",
        title: t("changes.show"),
        run: () => useChangesStore.getState().show(),
      },
      { id: "editor.save", title: t("editor.save"), keys: "Ctrl+S", run: save },
      {
        id: "editor.openFile",
        title: t("editor.openFile"),
        keys: "Ctrl+O",
        run: async () => {
          const path = await pickFile().catch(() => null);
          if (path) {
            await useEditorStore.getState().openFile(path);
          }
        },
      },
      {
        id: "editor.closeTab",
        title: t("editor.closeTab"),
        keys: "Ctrl+W",
        run: () => {
          const activePath = useEditorStore.getState().activePath;
          if (activePath) {
            requestCloseTab(activePath);
          }
        },
      },
    ]);
  }, [t]);

  useEffect(() => {
    const subscription = onCloseRequested(
      () => !hasUnsavedTabs() || window.confirm(translateNow("editor.confirmQuit")),
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
      {changesOpen && <ChangesView />}
      {!activePath && !changesOpen && <p className="editor__empty">{t("editor.empty")}</p>}
      <div ref={containerRef} className="editor__view" hidden={!activePath || changesOpen} />
    </div>
  );
}
