import { useEffect } from "react";
import { registerCommands, runCommand } from "../../lib/commands";
import { type MessageKey, useT } from "../../lib/i18n";
import { onFsChange } from "../../lib/ipc";
import type { ChangedFile } from "../../lib/types";
import { BranchPicker } from "./BranchPicker";
import { DiffView } from "./DiffView";
import { changeLabel } from "./diffLines";
import { useGitStore } from "./useGitStore";
import "./Git.css";

const STATUS_KEYS: Record<string, MessageKey> = {
  modified: "git.status.modified",
  added: "git.status.added",
  deleted: "git.status.deleted",
  renamed: "git.status.renamed",
  copied: "git.status.copied",
  untracked: "git.status.untracked",
  conflict: "git.status.conflict",
};

function FileRow({ file, staged }: { file: ChangedFile; staged: boolean }) {
  const t = useT();
  const selection = useGitStore((state) => state.selection);
  const { showFile, stage, unstage } = useGitStore.getState();
  const code = staged ? file.staged : file.unstaged;
  const selected =
    selection?.kind === "file" && selection.path === file.path && selection.staged === staged;
  return (
    <li className="git-dock__file" data-selected={selected}>
      <button type="button" className="git-dock__file-name" onClick={() => showFile(file, staged)}>
        <span className="git-dock__code" data-code={code}>
          {code}
        </span>
        <span title={file.path}>{file.path}</span>
        <span className="git-dock__counts">
          <span className="git-dock__added">+{file.added}</span>{" "}
          <span className="git-dock__removed">−{file.removed}</span>
        </span>
      </button>
      <button
        type="button"
        className="git-dock__file-action"
        aria-label={t(staged ? "git.unstageFile" : "git.stageFile", { path: file.path })}
        title={t(staged ? "git.unstageStatus" : "git.stageStatus", {
          status: STATUS_KEYS[changeLabel(code)]
            ? t(STATUS_KEYS[changeLabel(code)] as MessageKey)
            : "",
        })}
        onClick={() => (staged ? unstage(file) : stage(file))}
      >
        {staged ? "−" : "+"}
      </button>
    </li>
  );
}

function Changes() {
  const t = useT();
  const status = useGitStore((state) => state.status);
  const message = useGitStore((state) => state.message);
  const { setMessage, stageAll, commit } = useGitStore.getState();
  const files = status?.files ?? [];
  const staged = files.filter((file) => file.staged);
  const unstaged = files.filter((file) => file.unstaged);

  return (
    <div className="git-dock__changes">
      {files.length === 0 && <p className="git-dock__empty">{t("git.noChanges")}</p>}
      {files.length > 0 && (
        <button
          type="button"
          className="git-dock__view-changes"
          onClick={() => runCommand("editor.showChanges")}
        >
          ± {t("git.viewChanges")}
        </button>
      )}
      {staged.length > 0 && (
        <section aria-label={t("git.stagedChanges")}>
          <h3>{t("git.stagedCount", { count: staged.length })}</h3>
          <ul>
            {staged.map((file) => (
              <FileRow key={`s:${file.path}`} file={file} staged />
            ))}
          </ul>
        </section>
      )}
      {unstaged.length > 0 && (
        <section aria-label={t("git.changes")}>
          <h3>
            {t("git.changesCount", { count: unstaged.length })}
            <button type="button" className="git-dock__link" onClick={() => stageAll()}>
              {t("git.stageAll")}
            </button>
          </h3>
          <ul>
            {unstaged.map((file) => (
              <FileRow key={`u:${file.path}`} file={file} staged={false} />
            ))}
          </ul>
        </section>
      )}
      <div className="git-dock__commit">
        <textarea
          aria-label={t("git.commitMessage")}
          placeholder={t("git.commitMessage")}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              void commit();
            }
          }}
        />
        <button
          type="button"
          disabled={staged.length === 0 || !message.trim()}
          onClick={() => commit()}
        >
          {staged.length === 0
            ? t("git.commit")
            : staged.length === 1
              ? t("git.commitOne")
              : t("git.commitMany", { count: staged.length })}
        </button>
      </div>
    </div>
  );
}

function History() {
  const t = useT();
  const log = useGitStore((state) => state.log);
  const selection = useGitStore((state) => state.selection);
  const { showCommit } = useGitStore.getState();
  if (log.length === 0) {
    return <p className="git-dock__empty">{t("git.noCommits")}</p>;
  }
  return (
    <ul className="git-dock__history" aria-label={t("git.history")}>
      {log.map((commit) => (
        <li key={commit.hash}>
          <button
            type="button"
            data-selected={selection?.kind === "commit" && selection.hash === commit.hash}
            onClick={() => showCommit(commit)}
          >
            <span className="git-dock__subject">{commit.subject}</span>
            <span className="git-dock__meta">
              {commit.shortHash} · {commit.author} · {commit.date.slice(0, 10)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function GitDock() {
  const open = useGitStore((state) => state.open);
  const tab = useGitStore((state) => state.tab);
  const branch = useGitStore((state) => state.status?.branch);
  const t = useT();
  const diff = useGitStore((state) => state.diff);
  const error = useGitStore((state) => state.error);
  const { toggle, setTab, refresh } = useGitStore.getState();

  useEffect(
    () =>
      registerCommands([
        { id: "git.toggle", title: t("git.togglePanel"), keys: "Ctrl+Shift+G", run: toggle },
        {
          id: "git.refresh",
          title: t("git.refreshPanel"),
          run: () => useGitStore.getState().refresh(),
        },
      ]),
    [toggle, t],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const subscription = onFsChange(() => void useGitStore.getState().refresh());
    const onFocus = () => void useGitStore.getState().refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      subscription.then((unsubscribe) => unsubscribe());
      window.removeEventListener("focus", onFocus);
    };
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        className="git-dock__tab"
        aria-label={t("git.openPanel")}
        title="Git (Ctrl+Shift+G)"
        onClick={toggle}
      >
        <span aria-hidden="true">⎇</span>
      </button>
    );
  }
  return (
    <aside className="git-dock panel" aria-label={t("git.panel")}>
      <header className="git-dock__header">
        <div className="git-dock__tabs" role="tablist" aria-label={t("git.views")}>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "changes"}
            onClick={() => setTab("changes")}
          >
            {t("git.changes")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "history"}
            onClick={() => setTab("history")}
          >
            {t("git.history")}
          </button>
        </div>
        <button type="button" aria-label={t("git.refreshPanel")} onClick={() => refresh()}>
          ↻
        </button>
        <button type="button" aria-label={t("git.closePanel")} onClick={toggle}>
          ×
        </button>
      </header>
      {branch && (
        <div className="git-dock__branch">
          <BranchPicker current={branch} />
        </div>
      )}
      {error && (
        <p role="alert" className="git-dock__error">
          {error}
        </p>
      )}
      <div className="git-dock__body">{tab === "changes" ? <Changes /> : <History />}</div>
      {diff !== null && (
        <div className="git-dock__diff">
          <DiffView diff={diff} />
        </div>
      )}
    </aside>
  );
}
