import { useCallback, useEffect, useState } from "react";
import { runCommand } from "../../lib/commands";
import { useEditorStore } from "../../lib/editorStore";
import { useT } from "../../lib/i18n";
import {
  gitCommit,
  gitFileVersions,
  gitStage,
  gitStageAll,
  gitStatus,
  gitUnstage,
} from "../../lib/ipc";
import type { ChangedFile, FileVersions } from "../../lib/types";
import { FileDiff } from "./FileDiff";
import { type DiffLayout, useChangesStore } from "./useChangesStore";

type Loaded = { root: string; files: ChangedFile[]; versions: Record<string, FileVersions> };

function joinPath(root: string, relative: string): string {
  return `${root.replace(/[\\/]+$/, "")}/${relative}`;
}

export function ChangesView() {
  const t = useT();
  const layout = useChangesStore((state) => state.layout);
  const { hide, setLayout } = useChangesStore.getState();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const status = await gitStatus();
      const entries = await Promise.all(
        status.files.map(async (file) => [file.path, await gitFileVersions(file.path)] as const),
      );
      setLoaded({ root: status.root, files: status.files, versions: Object.fromEntries(entries) });
      setError(null);
    } catch (failure) {
      setError(String(failure).replace(/^Error: /, ""));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (work: () => Promise<unknown>) => {
    try {
      await work();
      setError(null);
    } catch (failure) {
      setError(String(failure).replace(/^Error: /, ""));
    }
    await load();
    runCommand("git.refresh");
  };

  const files = loaded?.files ?? [];
  const added = files.reduce((sum, file) => sum + file.added, 0);
  const removed = files.reduce((sum, file) => sum + file.removed, 0);
  const stagedCount = files.filter((file) => file.staged).length;

  return (
    <section className="changes" aria-label={t("changes.title")}>
      <header className="changes__toolbar">
        <span className="changes__counts">
          <span className="changes__added">+{added}</span>{" "}
          <span className="changes__removed">−{removed}</span>
        </span>
        <fieldset className="changes__layout" aria-label={t("changes.layout")}>
          {(["split", "unified"] as DiffLayout[]).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={layout === option}
              onClick={() => setLayout(option)}
            >
              {t(option === "split" ? "changes.split" : "changes.unified")}
            </button>
          ))}
        </fieldset>
        <button
          type="button"
          onClick={() => act(gitStageAll)}
          disabled={files.every((file) => !file.unstaged)}
        >
          {t("git.stageAll")}
        </button>
        <input
          className="changes__message"
          aria-label={t("git.commitMessage")}
          placeholder={t("git.commitMessage")}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <button
          type="button"
          className="changes__commit"
          disabled={stagedCount === 0 || !message.trim()}
          onClick={() =>
            act(async () => {
              await gitCommit(message);
              setMessage("");
            })
          }
        >
          {stagedCount === 1 ? t("git.commitOne") : t("git.commitMany", { count: stagedCount })}
        </button>
        <button type="button" aria-label={t("changes.close")} onClick={hide}>
          ×
        </button>
      </header>
      {error && (
        <p role="alert" className="changes__error">
          {error}
        </p>
      )}
      {!loaded && !error && <p className="changes__empty">{t("changes.loading")}</p>}
      {loaded && files.length === 0 && <p className="changes__empty">{t("changes.none")}</p>}
      <ul className="changes__files" aria-label={t("changes.files")}>
        {files.map((file) => {
          const isCollapsed = collapsed[file.path] ?? false;
          const versions = loaded?.versions[file.path];
          return (
            <li key={file.path} className="changes__file">
              <div className="changes__file-header">
                <button
                  type="button"
                  className="changes__toggle"
                  aria-expanded={!isCollapsed}
                  aria-label={t(isCollapsed ? "changes.expand" : "changes.collapse", {
                    path: file.path,
                  })}
                  onClick={() => setCollapsed({ ...collapsed, [file.path]: !isCollapsed })}
                >
                  {isCollapsed ? "▸" : "▾"}
                </button>
                <span className="changes__path" title={file.path}>
                  {file.path}
                </span>
                {file.staged && <span className="changes__badge">{t("changes.staged")}</span>}
                <span className="changes__counts">
                  <span className="changes__added">+{file.added}</span>{" "}
                  <span className="changes__removed">−{file.removed}</span>
                </span>
                <button
                  type="button"
                  aria-label={t(file.unstaged ? "git.stageFile" : "git.unstageFile", {
                    path: file.path,
                  })}
                  onClick={() =>
                    act(() => (file.unstaged ? gitStage([file.path]) : gitUnstage([file.path])))
                  }
                >
                  {t(file.unstaged ? "git.stage" : "git.unstage")}
                </button>
                <button
                  type="button"
                  aria-label={t("changes.openFileNamed", { path: file.path })}
                  onClick={async () => {
                    if (loaded) {
                      await useEditorStore.getState().openFile(joinPath(loaded.root, file.path));
                      hide();
                    }
                  }}
                >
                  {t("changes.openFile")}
                </button>
              </div>
              {!isCollapsed && versions && (
                <FileDiff
                  path={file.path}
                  before={versions.before}
                  after={versions.after}
                  layout={layout}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
