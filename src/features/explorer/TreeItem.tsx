import { useEditorStore } from "../../lib/editorStore";
import type { Entry } from "../../lib/types";
import { NewEntryInput } from "./NewEntryInput";
import { RenameInput } from "./RenameInput";
import { useWorkspaceStore } from "./useWorkspaceStore";

type TreeItemProps = {
  entry: Entry;
  depth: number;
};

export function TreeItem({ entry, depth }: TreeItemProps) {
  const isOpen = useWorkspaceStore((state) => state.expanded[entry.path] ?? false);
  const isSelected = useWorkspaceStore((state) => state.selected === entry.path);
  const children = useWorkspaceStore((state) => state.children[entry.path]);
  const creatingHere = useWorkspaceStore((state) => state.creating?.parent === entry.path);
  const renaming = useWorkspaceStore((state) => state.renaming?.path === entry.path);
  const openContextMenu = useWorkspaceStore((state) => state.openContextMenu);
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
      {renaming ? (
        <div style={{ paddingLeft: `${8 + depth * 12}px` }}>
          <RenameInput name={entry.name} />
        </div>
      ) : (
        <button
          type="button"
          className="tree__item"
          data-selected={isSelected}
          aria-expanded={entry.isDir ? isOpen : undefined}
          style={{ paddingLeft: `${8 + depth * 12}px` }}
          title={entry.path}
          onClick={handleClick}
          onContextMenu={(event) => {
            event.preventDefault();
            openContextMenu({ path: entry.path, x: event.clientX, y: event.clientY });
          }}
        >
          <span className="tree__icon" aria-hidden="true">
            {entry.isDir ? (isOpen ? "▾" : "▸") : ""}
          </span>
          {entry.name}
        </button>
      )}
      {entry.isDir && isOpen && children && (
        <ul className="tree">
          {creatingHere && <NewEntryInput depth={depth + 1} />}
          {children.map((child) => (
            <TreeItem key={child.path} entry={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
