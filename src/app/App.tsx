import { type CSSProperties, useEffect } from "react";
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
import { TerminalSettings } from "../features/terminal/TerminalSettings";
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
import { useEditorStore } from "../lib/editorStore";
import { useT } from "../lib/i18n";
import { clampSize, SIDEBAR_WIDTH, TERMINAL_HEIGHT, useLayoutStore } from "../lib/layoutStore";
import { ActivityBar } from "./ActivityBar";
import "./App.css";
import { LayoutSettings } from "./LayoutSettings";
import { MenuBar } from "./MenuBar";
import { ResizeHandle } from "./ResizeHandle";

const SIDEBAR_LABELS = {
  explorer: "app.explorer",
  search: "app.search",
  docker: "app.docker",
} as const;

function focusSearch(): void {
  requestAnimationFrame(() => document.querySelector<HTMLInputElement>("#search-input")?.focus());
}

export function App() {
  const t = useT();
  const fileOpen = useEditorStore((state) => state.activePath !== null);
  const sidebar = useLayoutStore((state) => state.sidebar);
  const menuBar = useLayoutStore((state) => state.menuBar);
  const sidebarOpen = useLayoutStore((state) => state.sidebarOpen);
  const activityBar = useLayoutStore((state) => state.activityBar);
  const statusBar = useLayoutStore((state) => state.statusBar);
  const tabs = useLayoutStore((state) => state.tabs);
  const zen = useLayoutStore((state) => state.zen);
  const sidebarWidth = useLayoutStore((state) => state.sidebarWidth);
  const terminalHeight = useLayoutStore((state) => state.terminalHeight);
  const resize = (key: "sidebarWidth" | "terminalHeight", limits: typeof SIDEBAR_WIDTH) => ({
    onPreview: (size: number) =>
      useLayoutStore.getState().preview({ [key]: clampSize(size, limits) }),
    onCommit: (size: number) =>
      useLayoutStore.getState().update({ [key]: clampSize(size, limits) }),
    onReset: () => useLayoutStore.getState().update({ [key]: limits.default }),
  });
  const isSidebarOpen = sidebarOpen && !zen;

  useEffect(() => {
    const layout = () => useLayoutStore.getState();
    return registerCommands([
      {
        id: "view.toggleExplorer",
        title: t("app.toggleSidebar"),
        keys: "Ctrl+B",
        run: () => {
          const { sidebarOpen, zen, update } = layout();
          useLayoutStore.setState({ zen: false });
          return update({ sidebarOpen: zen || !sidebarOpen });
        },
      },
      {
        id: "view.showExplorer",
        title: t("app.showExplorer"),
        keys: "Ctrl+Shift+E",
        run: () => layout().showView("explorer"),
      },
      {
        id: "search.show",
        title: t("app.searchInFiles"),
        keys: "Ctrl+Shift+F",
        run: async () => {
          await layout().showView("search");
          focusSearch();
        },
      },
      {
        id: "docker.show",
        title: t("app.showDocker"),
        keys: "Ctrl+Shift+D",
        run: () => layout().showView("docker"),
      },
      {
        id: "view.toggleActivityBar",
        title: t("app.toggleActivityBar"),
        run: () => layout().update({ activityBar: !layout().activityBar }),
      },
      {
        id: "view.toggleStatusBar",
        title: t("app.toggleStatusBar"),
        run: () => layout().update({ statusBar: !layout().statusBar }),
      },
      {
        id: "view.toggleTabs",
        title: t("app.toggleTabs"),
        run: () => layout().update({ tabs: !layout().tabs }),
      },
      {
        id: "view.toggleZen",
        title: t("app.toggleZen"),
        keys: "Ctrl+K Z",
        run: () => layout().toggleZen(),
      },
    ]);
  }, [t]);

  return (
    <>
      <Backdrop />
      {!zen && <MenuBar />}
      <div
        className="app"
        data-menu-bar={zen ? "never" : menuBar}
        data-explorer={isSidebarOpen ? "open" : "closed"}
        data-activity-bar={activityBar && !zen ? "shown" : "hidden"}
        data-statusbar={statusBar && !zen ? "shown" : "hidden"}
        data-tabs={tabs && !zen ? "shown" : "hidden"}
        data-zen={zen}
        style={
          {
            "--sidebar-size": `${sidebarWidth}px`,
            "--terminal-size": `${terminalHeight}px`,
          } as CSSProperties
        }
      >
        <div className="app__activity" hidden={!activityBar || zen}>
          <ActivityBar />
        </div>
        <aside
          className="app__explorer"
          aria-label={t(SIDEBAR_LABELS[sidebar])}
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
          <ResizeHandle
            label={t("app.resizeSidebar")}
            orientation="vertical"
            size={sidebarWidth}
            min={SIDEBAR_WIDTH.min}
            max={SIDEBAR_WIDTH.max}
            grow={1}
            {...resize("sidebarWidth", SIDEBAR_WIDTH)}
          />
        </aside>
        <main className="app__editor" aria-label={t("app.editor")} data-file-open={fileOpen}>
          <div className="app__workspace">
            <Editor />
            <MarkdownPane />
          </div>
          <Mascot />
        </main>
        <div className="app__terminal">
          <ResizeHandle
            label={t("app.resizeTerminal")}
            orientation="horizontal"
            size={terminalHeight}
            min={TERMINAL_HEIGHT.min}
            max={TERMINAL_HEIGHT.max}
            grow={-1}
            {...resize("terminalHeight", TERMINAL_HEIGHT)}
          />
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
        <TerminalSettings />
        <SnippetSettings />
        <UpdateSettings />
      </SettingsScreen>
      <SnippetCommands />
      <UpdateNotice />
      <ThemeWarnings />
    </>
  );
}
