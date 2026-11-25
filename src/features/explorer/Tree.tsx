import { TreeItem } from "./TreeItem";
import { useWorkspaceStore } from "./useWorkspaceStore";

type TreeProps = {
  root: string;
};

export function Tree({ root }: TreeProps) {
  const entries = useWorkspaceStore((state) => state.children[root]);

  if (!entries) {
    return null;
  }
  return (
    <ul className="tree" aria-label="Files">
      {entries.map((entry) => (
        <TreeItem key={entry.path} entry={entry} depth={0} />
      ))}
    </ul>
  );
}
