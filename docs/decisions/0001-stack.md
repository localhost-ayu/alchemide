# 0001. Technology stack

- Status: accepted
- Date: 2026-11-25

## Context

Alchemide is a personal, lightweight code editor for Windows and Linux (including WSL).
Its identity is visual customization: themes by mood, custom backgrounds, glass effects
and animations, each one switchable. It must start fast and use little memory, and the
UI must be easy to iterate on.

## Decision

| Area | Choice | Discarded |
| --- | --- | --- |
| Desktop shell | Tauri 2 | Electron (100+ MB, high memory use); GPUI (pure Rust, little documentation, no React) |
| Backend | Rust stable, edition 2021 | — |
| Frontend | React, TypeScript and Vite | — |
| Editor | CodeMirror 6 | Monaco (heavy and hard to customize) |
| Terminal | xterm.js with the fit addon, `portable-pty` in Rust (ConPTY on Windows) | — |
| Files | `ignore` (respects `.gitignore`) and `notify` (watcher) | — |
| Markdown | `react-markdown`, `remark-gfm` and `shiki` | — |
| Frontend state | zustand | Redux (too much boilerplate) |
| Lint and format | Biome for TS/JSON/CSS; clippy and rustfmt | ESLint and Prettier (two tools, more config) |
| Tests | `cargo test`, Vitest with Testing Library, Playwright against the web mode | tauri-driver (fragile, OS-dependent) |
| JS packages | pnpm via corepack | — |
| CI/CD | GitHub Actions and `tauri-action` | — |
| Platforms | Windows and Linux, including WSL | macOS (no machine to test on) |
| License | GPL-3.0-only | MIT (allows closed, sold forks); PolyForm Noncommercial (not open source) |
| Docker | Dev container for Linux and CI, plus a web mode with a mocked backend | Docker cannot produce Windows installers |

## Consequences

- The UI is plain React and CSS, so themes and effects are CSS variables and attributes on
  `<html>`, switched without re-rendering.
- Anything that touches the system must go through Rust commands, which keeps the security
  surface explicit in `capabilities/`.
- The web mode needs a mock for every IPC function, which also makes the UI testable in CI
  without building the desktop app.
- All dependencies are MIT or Apache-2.0, compatible with GPL-3.0-only.
