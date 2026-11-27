# 0005. Language servers

- Status: accepted
- Date: 2026-11-26

## Context

M7 adds autocomplete, hover, inline errors and go to definition through the Language Server
Protocol. The plan named `codemirror-languageserver` for the frontend, which talks to the server
over a WebSocket. Alchemide has no WebSocket server: the servers are local processes started by
Rust, and the only channel between Rust and the webview is Tauri's IPC.

## Decision

- The frontend uses `@codemirror/lsp-client` (MIT), maintained by the CodeMirror author. It
  accepts any transport, so messages go through `lsp_send` and the `lsp-message` event with no
  WebSocket and no extra port. `codemirror-languageserver` is not used.
- Rust starts each server with `std::process` (no shell), frames messages with
  `Content-Length` headers and reads stdout on a thread. There is one server per family and
  project folder: JS, TS, JSX and TSX share `typescript-language-server`.
- Servers come from a fixed list in `lsp/servers.rs` (Intelephense, `typescript-language-server`,
  `sqls`), found on `PATH`. The webview asks for a language, never for a program, so it cannot
  start arbitrary executables. On Windows the process gets `CREATE_NO_WINDOW`.
- A missing server is not an error: the status bar shows "No LSP" and its tooltip has the install
  command. A server that exits shows "LSP stopped" until "Restart language servers" is run.
  Changing the open folder stops every server.
- The editor has a single `EditorView` that swaps one state per tab, so `editorWorkspace.ts`
  replaces the library's default workspace: switching tabs closes and reopens the document on
  the server, and go to definition in another file opens it through the editor store.
- The web mode mock answers like a small server (completion, hover, definition and a diagnostic
  for `debugger`), so the end-to-end tests cover the whole client path.

## Consequences

- Alchemide does not install or ship language servers; the user installs them and they run under
  their own licenses, as `TERMS.md` already states.
- Documents in background tabs are closed on the server, so diagnostics only cover the active
  file and the files the server reads from disk.
- Renaming and "find references" come with `@codemirror/lsp-client` (`F2`, `Shift+F12`) but only
  apply to the open file; edits in other files are not supported yet.
