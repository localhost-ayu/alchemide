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
          <h2 className="explorer__title" title={folder.path}>
            {folder.name}
          </h2>
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
