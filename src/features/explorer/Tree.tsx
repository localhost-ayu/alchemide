import { NewEntryInput } from "./NewEntryInput";
import { TreeItem } from "./TreeItem";
import { useWorkspaceStore } from "./useWorkspaceStore";

type TreeProps = {
  root: string;
};

export function Tree({ root }: TreeProps) {
  const entries = useWorkspaceStore((state) => state.children[root]);
  const creatingHere = useWorkspaceStore((state) => state.creating?.parent === root);

  if (!entries) {
    return null;
  }
  return (
    <ul
      className="tree"
      aria-label="Files"
      onKeyDown={(event) => {
        const { startRename, deletePath, renaming, creating } = useWorkspaceStore.getState();
        if (renaming || creating || !(event.target instanceof HTMLButtonElement)) {
          return;
        }
        if (event.key === "F2") {
          event.preventDefault();
          startRename();
        } else if (event.key === "Delete") {
          event.preventDefault();
          void deletePath();
        }
      }}
    >
      {creatingHere && <NewEntryInput depth={0} />}
      {entries.map((entry) => (
        <TreeItem key={entry.path} entry={entry} depth={0} />
      ))}
    </ul>
  );
}
