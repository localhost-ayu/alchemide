import { useEffect, useMemo, useState } from "react";
import { registerCommands } from "../../lib/commands";
import { useEditorStore } from "../../lib/editorStore";
import { listFiles } from "../../lib/ipc";
import type { ProjectFile } from "../../lib/types";
import { rankByFuzzy } from "./fuzzyMatch";
import { Palette } from "./Palette";
import "./palette.css";

const MAX_RESULTS = 50;

function splitPath(relative: string): { name: string; folder: string } {
  const slash = relative.lastIndexOf("/");
  return slash === -1
    ? { name: relative, folder: "" }
    : { name: relative.slice(slash + 1), folder: relative.slice(0, slash) };
}

export function QuickOpen() {
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      registerCommands([
        {
          id: "palette.quickOpen",
          title: "Go to file",
          keys: "Ctrl+P",
          run: () => {
            setQuery("");
            setError(null);
            setOpen(true);
            listFiles()
              .then(setFiles)
              .catch((reason) => {
                setFiles([]);
                setError(String(reason));
              });
          },
        },
      ]),
    [],
  );

  const items = useMemo(
    () =>
      rankByFuzzy(query, files, (file) => file.relative)
        .slice(0, MAX_RESULTS)
        .map((file) => {
          const { name, folder } = splitPath(file.relative);
          return { id: file.path, label: name, detail: folder };
        }),
    [files, query],
  );

  if (!isOpen) {
    return null;
  }
  return (
    <Palette
      label="Go to file"
      placeholder="Search files by name"
      query={query}
      items={items}
      emptyText={error ? "Open a folder first" : "No matching file"}
      onQueryChange={setQuery}
      onClose={() => setOpen(false)}
      onChoose={(item) => {
        setOpen(false);
        useEditorStore.getState().openFile(item.id);
      }}
    />
  );
}
