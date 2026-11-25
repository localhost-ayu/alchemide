import "./Explorer.css";
import { Tree } from "./Tree";
import { useWorkspaceStore } from "./useWorkspaceStore";

export function Explorer() {
  const folder = useWorkspaceStore((state) => state.folder);
  const error = useWorkspaceStore((state) => state.error);
  const pickFolder = useWorkspaceStore((state) => state.pickFolder);

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
