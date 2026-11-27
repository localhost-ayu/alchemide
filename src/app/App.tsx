import { useEffect, useState } from "react";
import { DockerPanel } from "../features/docker/DockerPanel";
import { Editor } from "../features/editor/Editor";
import { Explorer } from "../features/explorer/Explorer";
import { MarkdownPane } from "../features/markdown/MarkdownPane";
import { CommandPalette } from "../features/palette/CommandPalette";
import { QuickOpen } from "../features/palette/QuickOpen";
import { SearchPanel } from "../features/search/SearchPanel";
import { SettingsScreen } from "../features/settings/SettingsScreen";
import { StatusBar } from "../features/statusbar/StatusBar";
import { TerminalPanel } from "../features/terminal/TerminalPanel";
import { Backdrop } from "../features/themes/Backdrop";
import { Mascot } from "../features/themes/Mascot";
import { MoodPicker } from "../features/themes/MoodPicker";
import { ThemeSettings } from "../features/themes/ThemeSettings";
import { ThemeWarnings } from "../features/themes/ThemeWarnings";
import { UpdateNotice } from "../features/updater/UpdateNotice";
import { UpdateSettings } from "../features/updater/UpdateSettings";
import { registerCommands } from "../lib/commands";
import "./App.css";

const SIDEBAR_LABELS = { explorer: "Explorer", search: "Search", docker: "Docker" };

export function App() {
  const [isExplorerOpen, setExplorerOpen] = useState(true);
  const [sidebar, setSidebar] = useState<"explorer" | "search" | "docker">("explorer");

  useEffect(
    () =>
      registerCommands([
        {
          id: "view.toggleExplorer",
          title: "Toggle explorer",
          keys: "Ctrl+B",
          run: () => setExplorerOpen((open) => !open),
        },
        {
          id: "view.showExplorer",
          title: "Show explorer",
          keys: "Ctrl+Shift+E",
          run: () => {
            setSidebar("explorer");
            setExplorerOpen(true);
          },
        },
        {
          id: "search.show",
          title: "Search in files",
          keys: "Ctrl+Shift+F",
          run: () => {
            setSidebar("search");
            setExplorerOpen(true);
            requestAnimationFrame(() =>
              document.querySelector<HTMLInputElement>('[aria-label="Search in files"]')?.focus(),
            );
          },
        },
        {
          id: "docker.show",
          title: "Show Docker containers",
          keys: "Ctrl+Shift+D",
          run: () => {
            setSidebar("docker");
            setExplorerOpen(true);
          },
        },
      ]),
    [],
  );

  return (
    <>
      <Backdrop />
      <div className="app" data-explorer={isExplorerOpen ? "open" : "closed"}>
        <aside
          className="app__explorer"
          aria-label={SIDEBAR_LABELS[sidebar]}
          hidden={!isExplorerOpen}
        >
          <div className="app__sidebar-view" hidden={sidebar !== "explorer"}>
            <Explorer />
          </div>
          <div className="app__sidebar-view" hidden={sidebar !== "search"}>
            <SearchPanel />
          </div>
          <div className="app__sidebar-view" hidden={sidebar !== "docker"}>
            <DockerPanel visible={isExplorerOpen && sidebar === "docker"} />
          </div>
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
      <SettingsScreen>
        <ThemeSettings />
        <UpdateSettings />
      </SettingsScreen>
      <UpdateNotice />
      <ThemeWarnings />
    </>
  );
}
