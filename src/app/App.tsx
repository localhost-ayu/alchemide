import { useEffect, useState } from "react";
import { Editor } from "../features/editor/Editor";
import { Explorer } from "../features/explorer/Explorer";
import { MarkdownPane } from "../features/markdown/MarkdownPane";
import { CommandPalette } from "../features/palette/CommandPalette";
import { QuickOpen } from "../features/palette/QuickOpen";
import { StatusBar } from "../features/statusbar/StatusBar";
import { TerminalPanel } from "../features/terminal/TerminalPanel";
import { Backdrop } from "../features/themes/Backdrop";
import { Mascot } from "../features/themes/Mascot";
import { MoodPicker } from "../features/themes/MoodPicker";
import { ThemeWarnings } from "../features/themes/ThemeWarnings";
import { registerCommands } from "../lib/commands";
import "./App.css";

export function App() {
  const [isExplorerOpen, setExplorerOpen] = useState(true);

  useEffect(
    () =>
      registerCommands([
        {
          id: "view.toggleExplorer",
          title: "Toggle explorer",
          keys: "Ctrl+B",
          run: () => setExplorerOpen((open) => !open),
        },
      ]),
    [],
  );

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
      <CommandPalette />
      <QuickOpen />
      <ThemeWarnings />
    </>
  );
}
