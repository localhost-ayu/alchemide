import { useEffect } from "react";
import { registerCommands } from "../../lib/commands";
import { onFsChange } from "../../lib/ipc";
import "./Explorer.css";
import { Tree } from "./Tree";
import { useWorkspaceStore } from "./useWorkspaceStore";

export function Explorer() {
  const folder = useWorkspaceStore((state) => state.folder);
  const error = useWorkspaceStore((state) => state.error);
  const pickFolder = useWorkspaceStore((state) => state.pickFolder);
  const refreshDirs = useWorkspaceStore((state) => state.refreshDirs);

  useEffect(
    () =>
      registerCommands([
        {
          id: "explorer.openFolder",
          title: "Open folder…",
          keys: "Ctrl+K Ctrl+O",
          run: () => useWorkspaceStore.getState().pickFolder(),
        },
        {
          id: "explorer.newFile",
          title: "New file",
          keys: "Ctrl+N",
          run: () => useWorkspaceStore.getState().startCreate(false),
        },
        {
          id: "explorer.newFolder",
          title: "New folder",
          run: () => useWorkspaceStore.getState().startCreate(true),
        },
      ]),
    [],
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
            <h2 className="explorer__title" title={folder.path}>
              {folder.name}
            </h2>
            <button
              type="button"
              className="explorer__action"
              aria-label="New file"
              title="New file (Ctrl+N)"
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
              aria-label="New folder"
              title="New folder"
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
        </>
      ) : (
        <button type="button" className="explorer__open" onClick={pickFolder}>
          Open folder
        </button>
      )}
      {error && (
        <p role="alert" className="explorer__error">
          {error}
        </p>
      )}
    </div>
  );
}
