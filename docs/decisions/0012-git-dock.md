# 0012. Git dock

- Status: accepted
- Date: 2026-11-27

## Context

Reviewing changes, staging and committing meant switching to the terminal or another editor.
The reference was Zed's Git panel: a dock on the right with the changes and the history.

## Decision

- Scope chosen with the user: look and commit. The dock lists changed files with their diff,
  stages and unstages per file, stages everything, commits with a message and shows the history
  with the diff of each commit. Push, pull, branches and discarding changes stay in the terminal.
- Rust runs the `git` CLI directly (no shell, no console window on Windows,
  `GIT_TERMINAL_PROMPT=0`), from the repository root found with `git rev-parse --show-toplevel`.
  The user's own git configuration applies, including hooks and signing.
- Output is read with stable formats and parsed by pure, tested functions:
  `git status --porcelain=v1 -z --branch` and `git log` with unit and record separators.
- Paths from the webview must be plain relative paths (no `..`, no absolute paths) and are
  passed after `--`; commit hashes must be hexadecimal. A folder outside a repository shows a
  message instead of an error.
- The dock is a grid column: a 22 px tab when closed, 360 px when open, hidden in zen mode. It
  refreshes when it opens, after each action, when the window gets focus and on file changes.

- Inline blame (issue #131): `git_blame` runs `git blame --porcelain` from the file's folder for a
  file the workspace allows, and `parse_blame` turns it into the commits and the commit of each
  line. The editor shows the author and age of the cursor line at its end, with the commit subject
  on hover, and hides it while the text has unsaved changes (the line numbers no longer match);
  it is fetched again when the file is opened, activated or saved. A file outside a repository or
  not tracked yet shows nothing. Settings → Editor turns it off (`editor.inlineBlame`).

## Consequences

- No git library is bundled; Alchemide needs `git` on the `PATH`, as for the terminal.
- On Windows, a project inside WSL is read by Windows' git through the `\\wsl$` path, which can be
  slower than inside WSL.
