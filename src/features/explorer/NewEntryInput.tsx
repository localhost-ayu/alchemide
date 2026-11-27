import { useState } from "react";
import { useT } from "../../lib/i18n";
import { useWorkspaceStore } from "./useWorkspaceStore";

type NewEntryInputProps = {
  depth: number;
};

export function NewEntryInput({ depth }: NewEntryInputProps) {
  const t = useT();
  const creating = useWorkspaceStore((state) => state.creating);
  const { confirmCreate, cancelCreate } = useWorkspaceStore.getState();
  const [name, setName] = useState("");

  if (!creating) {
    return null;
  }
  const label = t(creating.isDir ? "explorer.newFolderName" : "explorer.newFileName");
  return (
    <li className="tree__new" style={{ paddingLeft: `${8 + depth * 12}px` }}>
      <span className="tree__icon" aria-hidden="true">
        {creating.isDir ? "▸" : ""}
      </span>
      <input
        // biome-ignore lint/a11y/noAutofocus: the input appears because the user asked to type a name
        autoFocus
        aria-label={label}
        placeholder={t(
          creating.isDir ? "explorer.folderNamePlaceholder" : "explorer.fileNamePlaceholder",
        )}
        value={name}
        aria-invalid={creating.error !== null}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void confirmCreate(name);
          } else if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            cancelCreate();
          }
        }}
        onBlur={() => (name.trim() ? undefined : cancelCreate())}
      />
      {creating.error && (
        <p role="alert" className="tree__new-error">
          {creating.error}
        </p>
      )}
    </li>
  );
}
