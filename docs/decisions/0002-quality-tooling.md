# 0002. Quality tooling and test layers

- Status: accepted
- Date: 2026-11-25

## Context

The app has three layers to test: pure Rust logic, React components and the UI as a whole.
Tauri's own end-to-end driver depends on the operating system and is fragile, and the
npm scripts `dev` and `build` call the Tauri CLI, which in turn runs the frontend build.

## Decision

- `pnpm check` runs Biome, Clippy (`-D warnings`), `tsc` and both test runners. It is the
  single command that must pass before a pull request.
- Rust logic is tested with `cargo test` against pure functions; commands stay thin.
- Vitest runs with `jsdom` in Vite's `test` mode, which swaps `src/lib/ipc.ts` for the mock
  exactly like `pnpm dev:web`, so component tests never touch Tauri.
- Playwright runs against `pnpm dev:web` in Chromium.
- Tauri calls `pnpm exec vite` and `pnpm build:web` directly, because `pnpm dev` and
  `pnpm build` now start Tauri itself and would recurse.
- The pre-commit hook only checks formatting and lint of staged files; full tests run in CI.

## Consequences

- End-to-end tests cover the UI and the IPC contract as mocked, not the real Rust backend;
  that side is covered by `cargo test`.
- Every IPC function needs a realistic mock, or the UI tests lose meaning.
