import { useEffect, useState } from "react";
import { Editor } from "../features/editor/Editor";
import { Explorer } from "../features/explorer/Explorer";
import { MarkdownPane } from "../features/markdown/MarkdownPane";
import { StatusBar } from "../features/statusbar/StatusBar";
import { TerminalPanel } from "../features/terminal/TerminalPanel";
import { Backdrop } from "../features/themes/Backdrop";
import { Mascot } from "../features/themes/Mascot";
import { MoodPicker } from "../features/themes/MoodPicker";
import { ThemeWarnings } from "../features/themes/ThemeWarnings";
import "./App.css";

export function App() {
  const [isExplorerOpen, setExplorerOpen] = useState(true);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setExplorerOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Backdrop />
      <div className="app" data-explorer={isExplorerOpen ? "open" : "closed"}>
        <aside className="app__explorer" aria-label="Explorer" hidden={!isExplorerOpen}>
          <Explorer />
        </aside>
        <main className="app__editor" aria-label="Editor">
          <div className="app__workspace">
            <Editor />
            <MarkdownPane />
          </div>
          <Mascot />
        </main>
        <div className="app__terminal">
          <TerminalPanel />
        </div>
        <footer className="app__statusbar">
          <StatusBar />
        </footer>
      </div>
      <MoodPicker />
      <ThemeWarnings />
    </>
  );
}
