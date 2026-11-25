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

## The IPC rule

Only `src/lib/ipc.ts` calls `invoke()` or listens to backend events. Components and
stores call the typed functions it exports.

Types shared by both sides of the IPC boundary live in `src/lib/types.ts`, mirroring the
serialized Rust types (enums use a `kind` tag, for example `{ "kind": "wsl", "distro": "Ubuntu" }`).

Every function in `ipc.ts` has a twin in `src/lib/ipc.mock.ts` that returns sample data.
`pnpm dev:web` swaps one module for the other with a Vite alias (any import ending in `lib/ipc`), so the whole UI runs in a
regular browser without compiling Rust, and the end-to-end tests run against that mode.

## Backend (`src-tauri/`)

- Commands are thin: a `#[tauri::command]` reads what it needs from the system, calls a
  pure function from its module and returns the result. The logic stays testable with
  `cargo test`, without a window.
- Errors go through a single type in `src/error.rs` (`thiserror`), serialized for the frontend.
- Long-running work (file watching, terminal output) pushes data to the UI with Tauri events.
- Permissions in `capabilities/` are kept to the minimum each feature needs. Broad disk
  access is never granted for convenience.

## User content

Wallpapers, mascots and settings live in the user's config folder (`%APPDATA%` on Windows,
`~/.config` on Linux). The app stores only paths relative to that folder; none of that
content ships with the app or enters the repository.

Decisions and their reasons are recorded in [`decisions/`](decisions/).
