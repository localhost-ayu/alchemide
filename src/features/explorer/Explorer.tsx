import { useEffect, useState } from "react";
import { registerCommands } from "../../lib/commands";
import { useT } from "../../lib/i18n";
import { onFsChange } from "../../lib/ipc";
import "./Explorer.css";
import { ExplorerContextMenu } from "./ExplorerContextMenu";
import { ProjectSwitcher } from "./ProjectSwitcher";
import { RecentProjects } from "./RecentProjects";
import { Tree } from "./Tree";
import { useWorkspaceStore } from "./useWorkspaceStore";

export function Explorer() {
  const folder = useWorkspaceStore((state) => state.folder);
  const error = useWorkspaceStore((state) => state.error);
  const pickFolder = useWorkspaceStore((state) => state.pickFolder);
  const refreshDirs = useWorkspaceStore((state) => state.refreshDirs);
  const t = useT();
  const [switcherRequest, setSwitcherRequest] = useState(0);

  useEffect(
    () =>
      registerCommands([
        {
          id: "explorer.openFolder",
          title: t("explorer.openFolderCommand"),
          keys: "Ctrl+K Ctrl+O",
          run: () => useWorkspaceStore.getState().pickFolder(),
        },
        {
          id: "explorer.recentProjects",
          title: t("projects.command"),
          keys: "Ctrl+Alt+O",
          run: () => setSwitcherRequest((count) => count + 1),
        },
        {
          id: "explorer.newFile",
          title: t("explorer.newFile"),
          keys: "Ctrl+N",
          run: () => useWorkspaceStore.getState().startCreate(false),
        },
        {
          id: "explorer.newFolder",
          title: t("explorer.newFolder"),
          run: () => useWorkspaceStore.getState().startCreate(true),
        },
        {
          id: "explorer.rename",
          title: t("explorer.renameSelected"),
          run: () => useWorkspaceStore.getState().startRename(),
        },
        {
          id: "explorer.delete",
          title: t("explorer.deleteSelected"),
          run: () => useWorkspaceStore.getState().deletePath(),
        },
      ]),
    [t],
  );

  useEffect(() => {
    if (!folder) {
      return;
    }
    const subscription = onFsChange(refreshDirs);
    return () => {
      subscription.then((unsubscribe) => unsubscribe());
    };
  }, [folder, refreshDirs]);

  return (
    <div className="explorer">
      {folder ? (
        <>
          <div className="explorer__header">
            <ProjectSwitcher current={folder} openRequest={switcherRequest} />
            <button
              type="button"
              className="explorer__action"
              aria-label={t("explorer.newFile")}
              title={t("explorer.newFileShortcut")}
              onClick={() => useWorkspaceStore.getState().startCreate(false)}
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path
                  d="M9 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.5zM9 1.5v4h4M8 8v4M6 10h4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="explorer__action"
              aria-label={t("explorer.newFolder")}
              title={t("explorer.newFolder")}
              onClick={() => useWorkspaceStore.getState().startCreate(true)}
            >
              <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                <path
                  d="M1.5 4a1 1 0 0 1 1-1h3.5l1.5 1.5h6a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1zM8 7v4M6 9h4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <Tree root={folder.path} />
          <ExplorerContextMenu />
        </>
      ) : (
        <>
          <button type="button" className="explorer__open" onClick={pickFolder}>
            {t("explorer.openFolder")}
          </button>
          <RecentProjects />
        </>
      )}
      {error && (
        <p role="alert" className="explorer__error">
          {error}
        </p>
      )}
    </div>
  );
}
