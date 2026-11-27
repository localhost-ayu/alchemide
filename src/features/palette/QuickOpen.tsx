import { useEffect, useMemo, useState } from "react";
import { registerCommands } from "../../lib/commands";
import { useEditorStore } from "../../lib/editorStore";
import { useT } from "../../lib/i18n";
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
  const t = useT();
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      registerCommands([
        {
          id: "palette.quickOpen",
          title: t("palette.goToFile"),
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
    [t],
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
      label={t("palette.goToFile")}
      placeholder={t("palette.searchFiles")}
      query={query}
      items={items}
      emptyText={error ? t("palette.openFolderFirst") : t("palette.noFile")}
      onQueryChange={setQuery}
      onClose={() => setOpen(false)}
      onChoose={(item) => {
        setOpen(false);
        useEditorStore.getState().openFile(item.id);
      }}
    />
  );
}
