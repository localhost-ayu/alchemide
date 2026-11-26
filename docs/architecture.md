# Architecture

Alchemide is a [Tauri 2](https://tauri.app/) app: a Rust process owns the window and
everything that touches the operating system, and a React UI runs inside the system
webview (WebView2 on Windows, WebKitGTK on Linux).

```text
┌──────────────────────── webview ────────────────────────┐
│  React components ── stores (zustand) ── src/lib/ipc.ts │
└──────────────────────────────┬──────────────────────────┘
                     invoke() / events
┌──────────────────────────────┴──────────────────────────┐
│  #[tauri::command] ── pure module functions ── OS       │
└──────────────────────── Rust ───────────────────────────┘
```

## Frontend (`src/`)

- `app/`: layout, panels and global shortcuts.
- `features/`: one folder per feature (`editor`, `explorer`, `terminal`, `markdown`,
  `statusbar`, `themes`, `settings`). Features never import from each other; anything
  shared moves to `lib/` or to a store.
- `lib/`: shared code, including the IPC layer.
- `styles/`: design tokens and visual effects as CSS variables.

Features that need the current look without importing `themes/` read the CSS variables on
`<html>` (the terminal rebuilds its xterm palette with a `MutationObserver`).

Every action that has a shortcut or appears in the command palette is registered in
`src/lib/commands.ts` (`registerCommands`, usually from a component's effect). A single
`keydown` listener dispatches shortcuts, including chords such as `Ctrl+K M`, and the terminal
asks the same registry (`keyBelongsToApp`) which keys skip the shell.

## The IPC rule

Only `src/lib/ipc.ts` calls `invoke()` or listens to backend events. Components and
stores call the typed functions it exports.

Types shared by both sides of the IPC boundary live in `src/lib/types.ts`, mirroring the
serialized Rust types (enums use a `kind` tag, for example `{ "kind": "wsl", "distro": "Ubuntu" }`).

Every function in `ipc.ts` has a twin in `src/lib/ipc.mock.ts` that returns sample data.
`pnpm dev:web` swaps one module for the other with a Vite alias (any import of `lib/ipc`,
or `./ipc` from inside `lib/`), so the whole UI runs in a
regular browser without compiling Rust, and the end-to-end tests run against that mode.

## Backend (`src-tauri/`)

- Commands are thin: a `#[tauri::command]` reads what it needs from the system, calls a
  pure function from its module and returns the result. The logic stays testable with
  `cargo test`, without a window.
- Errors go through a single type in `src/error.rs` (`thiserror`), serialized for the frontend
  as a plain message string.
- The open folder is chosen by Rust through the dialog plugin's Rust API and kept in the
  `fs::Workspace` state. The frontend never sends the root path, and the webview gets no
  dialog permission.
- Long-running work (file watching, terminal output) pushes data to the UI with Tauri events.
- Terminals run in a PTY from `portable-pty` (ConPTY on Windows). A reader thread per session
  sends output as `terminal-output` events, holding back an incomplete UTF-8 sequence until the
  next read; `terminal-exit` reports the end. Input, resize and close arrive as commands, and the
  webview never chooses which program runs.
- File watching is non-recursive and limited to the folders the explorer has loaded. Watching
  the whole project recursively would also cover `node_modules` and `target`, generating
  noise and exhausting inotify watches. The `fs-changed` event carries the folders to reload.
- Permissions in `capabilities/` are kept to the minimum each feature needs. Broad disk
  access is never granted for convenience. Today the window has `core:default` plus
  `core:window:allow-destroy`, needed to close the window after the unsaved-changes check.
  File access goes through app commands that reject paths outside the open folder.
- The asset protocol is enabled only for `backgrounds/*` and `mascots/*` inside the app config
  folder, so the webview can show the user's background and mascot and nothing else on disk.
  `asset_path` also rejects any path outside those two folders.
- Links from the Markdown preview go through `open_external`, which accepts only `http`,
  `https` and `mailto` and calls the opener crate from Rust; the opener plugin is not registered,
  so the webview has no way to open arbitrary files or programs.

## User content

Wallpapers, mascots and settings live in the user's config folder (`%APPDATA%` on Windows,
`~/.config` on Linux). The app stores only paths relative to that folder; none of that
content ships with the app or enters the repository.

Settings live in `settings.json` in the same folder (`config.rs`). Rust treats the file as an
opaque JSON object, written atomically, and falls back to `{}` when it is missing or broken; the
frontend validates each field it reads.

Decisions and their reasons are recorded in [`decisions/`](decisions/).
