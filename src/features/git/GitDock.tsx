import { useEffect } from "react";
import { registerCommands } from "../../lib/commands";
import { onFsChange } from "../../lib/ipc";
import type { ChangedFile } from "../../lib/types";
import { DiffView } from "./DiffView";
import { changeLabel } from "./diffLines";
import { useGitStore } from "./useGitStore";
import "./Git.css";

function FileRow({ file, staged }: { file: ChangedFile; staged: boolean }) {
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
      </button>
      <button
        type="button"
        className="git-dock__file-action"
        aria-label={`${staged ? "Unstage" : "Stage"} ${file.path}`}
        title={`${staged ? "Unstage" : "Stage"} (${changeLabel(code)})`}
        onClick={() => (staged ? unstage(file) : stage(file))}
      >
        {staged ? "−" : "+"}
      </button>
    </li>
  );
}

function Changes() {
  const status = useGitStore((state) => state.status);
  const message = useGitStore((state) => state.message);
  const { setMessage, stageAll, commit } = useGitStore.getState();
  const files = status?.files ?? [];
  const staged = files.filter((file) => file.staged);
  const unstaged = files.filter((file) => file.unstaged);

  return (
    <div className="git-dock__changes">
      {files.length === 0 && <p className="git-dock__empty">No changes to commit</p>}
      {staged.length > 0 && (
        <section aria-label="Staged changes">
          <h3>Staged ({staged.length})</h3>
          <ul>
            {staged.map((file) => (
              <FileRow key={`s:${file.path}`} file={file} staged />
            ))}
          </ul>
        </section>
      )}
      {unstaged.length > 0 && (
        <section aria-label="Changes">
          <h3>
            Changes ({unstaged.length})
            <button type="button" className="git-dock__link" onClick={() => stageAll()}>
              Stage all
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
          aria-label="Commit message"
          placeholder="Commit message"
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
          Commit{" "}
          {staged.length > 0 ? `${staged.length} ${staged.length === 1 ? "file" : "files"}` : ""}
        </button>
      </div>
    </div>
  );
}

function History() {
  const log = useGitStore((state) => state.log);
  const selection = useGitStore((state) => state.selection);
  const { showCommit } = useGitStore.getState();
  if (log.length === 0) {
    return <p className="git-dock__empty">No commits yet</p>;
  }
  return (
    <ul className="git-dock__history" aria-label="History">
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
  const branches = useGitStore((state) => state.branches);
  const diff = useGitStore((state) => state.diff);
  const error = useGitStore((state) => state.error);
  const { toggle, setTab, refresh, switchBranch } = useGitStore.getState();

  useEffect(
    () =>
      registerCommands([
        { id: "git.toggle", title: "Toggle Git panel", keys: "Ctrl+Shift+G", run: toggle },
        {
          id: "git.refresh",
          title: "Refresh Git panel",
          run: () => useGitStore.getState().refresh(),
        },
      ]),
    [toggle],
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
        aria-label="Open Git panel"
        title="Git (Ctrl+Shift+G)"
        onClick={toggle}
      >
        <span aria-hidden="true">⎇</span>
      </button>
    );
  }
  return (
    <aside className="git-dock panel" aria-label="Git">
      <header className="git-dock__header">
        <div className="git-dock__tabs" role="tablist" aria-label="Git views">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "changes"}
            onClick={() => setTab("changes")}
          >
            Changes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "history"}
            onClick={() => setTab("history")}
          >
            History
          </button>
        </div>
        <button type="button" aria-label="Refresh Git panel" onClick={() => refresh()}>
          ↻
        </button>
        <button type="button" aria-label="Close Git panel" onClick={toggle}>
          ×
        </button>
      </header>
      {branch && (
        <label className="git-dock__branch">
          <span aria-hidden="true">⎇</span>
          <select
            aria-label="Branch"
            value={branch}
            onChange={(event) => switchBranch(event.target.value)}
          >
            {branches.map((item) => (
              <option key={item.name} value={item.name}>
                {item.remoteOnly ? `${item.name} (remote)` : item.name}
              </option>
            ))}
            {!branches.some((item) => item.name === branch) && (
              <option value={branch}>{branch}</option>
            )}
          </select>
        </label>
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
