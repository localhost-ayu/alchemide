import { useState } from "react";
import { useT } from "../../lib/i18n";
import { useWorkspaceStore } from "./useWorkspaceStore";

type RenameInputProps = {
  name: string;
};

export function RenameInput({ name }: RenameInputProps) {
  const t = useT();
  const error = useWorkspaceStore((state) => state.renaming?.error ?? null);
  const { confirmRename, cancelRename } = useWorkspaceStore.getState();
  const [value, setValue] = useState(name);
  const stem = name.lastIndexOf(".") > 0 ? name.lastIndexOf(".") : name.length;

  return (
    <div className="tree__rename">
      <input
        // biome-ignore lint/a11y/noAutofocus: the input appears because the user asked to rename
        autoFocus
        aria-label={t("explorer.newNameFor", { name })}
        value={value}
        aria-invalid={error !== null}
        onFocus={(event) => event.target.setSelectionRange(0, stem)}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void confirmRename(value);
          } else if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            cancelRename();
          }
        }}
        onBlur={() => (error ? undefined : void confirmRename(value))}
      />
      {error && (
        <p role="alert" className="tree__new-error">
          {error}
        </p>
      )}
    </div>
  );
}
