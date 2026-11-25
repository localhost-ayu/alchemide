import { useEditorStore } from "../../lib/editorStore";
import type { Entry } from "../../lib/types";
import { useWorkspaceStore } from "./useWorkspaceStore";

type TreeItemProps = {
  entry: Entry;
  depth: number;
};

export function TreeItem({ entry, depth }: TreeItemProps) {
  const isOpen = useWorkspaceStore((state) => state.expanded[entry.path] ?? false);
  const isSelected = useWorkspaceStore((state) => state.selected === entry.path);
  const children = useWorkspaceStore((state) => state.children[entry.path]);
  const toggleDir = useWorkspaceStore((state) => state.toggleDir);
  const select = useWorkspaceStore((state) => state.select);
  const openFile = useEditorStore((state) => state.openFile);

  const handleClick = () => {
    select(entry.path);
    if (entry.isDir) {
      toggleDir(entry.path);
    } else {
      openFile(entry.path);
    }
  };

  return (
    <li>
      <button
        type="button"
        className="tree__item"
        data-selected={isSelected}
        aria-expanded={entry.isDir ? isOpen : undefined}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        title={entry.path}
        onClick={handleClick}
      >
        <span className="tree__icon" aria-hidden="true">
          {entry.isDir ? (isOpen ? "▾" : "▸") : ""}
        </span>
        {entry.name}
      </button>
      {entry.isDir && isOpen && children && (
        <ul className="tree">
          {children.map((child) => (
            <TreeItem key={child.path} entry={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
