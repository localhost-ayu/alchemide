import { useEffect } from "react";
import { DockerPanel } from "../features/docker/DockerPanel";
import { Editor } from "../features/editor/Editor";
import { Explorer } from "../features/explorer/Explorer";
import { GitDock } from "../features/git/GitDock";
import { MarkdownPane } from "../features/markdown/MarkdownPane";
import { CommandPalette } from "../features/palette/CommandPalette";
import { QuickOpen } from "../features/palette/QuickOpen";
import { SearchPanel } from "../features/search/SearchPanel";
import { SettingsScreen } from "../features/settings/SettingsScreen";
import { SnippetCommands } from "../features/snippets/SnippetCommands";
import { SnippetSettings } from "../features/snippets/SnippetSettings";
import { StatusBar } from "../features/statusbar/StatusBar";
import { TerminalPanel } from "../features/terminal/TerminalPanel";
import { Backdrop } from "../features/themes/Backdrop";
import { Mascot } from "../features/themes/Mascot";
import { MoodPicker } from "../features/themes/MoodPicker";
import { ThemeCommands } from "../features/themes/ThemeCommands";
import { ThemeEditor } from "../features/themes/ThemeEditor";
import { ThemeSettings } from "../features/themes/ThemeSettings";
import { ThemeWarnings } from "../features/themes/ThemeWarnings";
import { VscodeThemePicker } from "../features/themes/VscodeThemePicker";
import { UpdateNotice } from "../features/updater/UpdateNotice";
import { UpdateSettings } from "../features/updater/UpdateSettings";
import { registerCommands } from "../lib/commands";
import { useLayoutStore } from "../lib/layoutStore";
import { ActivityBar } from "./ActivityBar";
import "./App.css";
import { LayoutSettings } from "./LayoutSettings";

const SIDEBAR_LABELS = { explorer: "Explorer", search: "Search", docker: "Docker" };

function focusSearch(): void {
  requestAnimationFrame(() =>
    document.querySelector<HTMLInputElement>('[aria-label="Search in files"]')?.focus(),
  );
}

export function App() {
  const sidebar = useLayoutStore((state) => state.sidebar);
  const sidebarOpen = useLayoutStore((state) => state.sidebarOpen);
  const activityBar = useLayoutStore((state) => state.activityBar);
  const statusBar = useLayoutStore((state) => state.statusBar);
  const tabs = useLayoutStore((state) => state.tabs);
  const zen = useLayoutStore((state) => state.zen);
  const isSidebarOpen = sidebarOpen && !zen;

  useEffect(() => {
    const layout = () => useLayoutStore.getState();
    return registerCommands([
      {
        id: "view.toggleExplorer",
        title: "Toggle side bar",
        keys: "Ctrl+B",
        run: () => {
          const { sidebarOpen, zen, update } = layout();
          useLayoutStore.setState({ zen: false });
          return update({ sidebarOpen: zen || !sidebarOpen });
        },
      },
      {
        id: "view.showExplorer",
        title: "Show explorer",
        keys: "Ctrl+Shift+E",
        run: () => layout().showView("explorer"),
      },
      {
        id: "search.show",
        title: "Search in files",
        keys: "Ctrl+Shift+F",
        run: async () => {
          await layout().showView("search");
          focusSearch();
        },
      },
      {
        id: "docker.show",
        title: "Show Docker containers",
        keys: "Ctrl+Shift+D",
        run: () => layout().showView("docker"),
      },
      {
        id: "view.toggleActivityBar",
        title: "Toggle activity bar",
        run: () => layout().update({ activityBar: !layout().activityBar }),
      },
      {
        id: "view.toggleStatusBar",
        title: "Toggle status bar",
        run: () => layout().update({ statusBar: !layout().statusBar }),
      },
      {
        id: "view.toggleTabs",
        title: "Toggle editor tabs",
        run: () => layout().update({ tabs: !layout().tabs }),
      },
      {
        id: "view.toggleZen",
        title: "Toggle zen mode",
        keys: "Ctrl+K Z",
        run: () => layout().toggleZen(),
      },
    ]);
  }, []);

  return (
    <>
      <Backdrop />
      <div
        className="app"
        data-explorer={isSidebarOpen ? "open" : "closed"}
        data-activity-bar={activityBar && !zen ? "shown" : "hidden"}
        data-statusbar={statusBar && !zen ? "shown" : "hidden"}
        data-tabs={tabs && !zen ? "shown" : "hidden"}
        data-zen={zen}
      >
        <div className="app__activity" hidden={!activityBar || zen}>
          <ActivityBar />
        </div>
        <aside
          className="app__explorer"
          aria-label={SIDEBAR_LABELS[sidebar]}
          hidden={!isSidebarOpen}
        >
          <div className="app__sidebar-view" hidden={sidebar !== "explorer"}>
            <Explorer />
          </div>
          <div className="app__sidebar-view" hidden={sidebar !== "search"}>
            <SearchPanel />
          </div>
          <div className="app__sidebar-view" hidden={sidebar !== "docker"}>
            <DockerPanel visible={isSidebarOpen && sidebar === "docker"} />
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
        <div className="app__git" hidden={zen}>
          <GitDock />
        </div>
        <footer className="app__statusbar" hidden={!statusBar || zen}>
          <StatusBar />
        </footer>
      </div>
      <MoodPicker />
      <ThemeCommands />
      <VscodeThemePicker />
      <ThemeEditor />
      <CommandPalette />
      <QuickOpen />
      <SettingsScreen>
        <ThemeSettings />
        <LayoutSettings />
        <SnippetSettings />
        <UpdateSettings />
      </SettingsScreen>
      <SnippetCommands />
      <UpdateNotice />
      <ThemeWarnings />
    </>
  );
}
