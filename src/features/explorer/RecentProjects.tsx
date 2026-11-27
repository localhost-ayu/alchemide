import { useEffect, useState } from "react";
import { useT } from "../../lib/i18n";
import { recentFolders } from "../../lib/ipc";
import type { Folder } from "../../lib/types";
import { useWorkspaceStore } from "./useWorkspaceStore";

export function RecentProjects() {
  const t = useT();
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    recentFolders()
      .then(setFolders)
      .catch(() => setFolders([]));
  }, []);

  if (folders.length === 0) {
    return null;
  }
  return (
    <section className="explorer__recent" aria-label={t("projects.recent")}>
      <h3>{t("projects.recent")}</h3>
      <ul>
        {folders.map((folder) => (
          <li key={folder.path}>
            <button
              type="button"
              title={folder.path}
              onClick={() => useWorkspaceStore.getState().openRecent(folder.path)}
            >
              {folder.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
