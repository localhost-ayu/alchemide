# Contributing

Thanks for your interest in Alchemide. This is a small personal project, so please
open an issue to discuss larger changes before writing code.

## Running locally

Install Rust (stable), Node LTS (see `.nvmrc`), pnpm via corepack and the
[Tauri prerequisites](https://tauri.app/start/prerequisites/). Then:

```bash
pnpm install
pnpm dev        # desktop app
pnpm dev:web    # UI only, in the browser, with a mocked backend
pnpm check      # lint, typecheck and tests
```

There are three ways to run the app:

| Mode             | Runs on                             | Use it for                                         |
| ---------------- | ----------------------------------- | -------------------------------------------------- |
| `pnpm dev:web`   | Browser, mocked backend             | UI and theme work without compiling Rust           |
| Dev container    | Docker in WSL2, window through WSLg | Linux builds identical to CI (`.deb`, `.AppImage`) |
| `pnpm tauri dev` | Native Windows                      | Windows-specific behavior: WSL, ConPTY, WebView2   |

To use the dev container, open the project inside WSL in VS Code and run
"Dev Containers: Reopen in Container". The Rust build output lives in the
`alchemide-cargo-target` volume, so it survives container rebuilds.

Enable the repository hooks once after cloning:

```bash
git config core.hooksPath .githooks
```

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) in English,
for example `feat(editor): add PHP syntax highlighting` or `fix(explorer): keep folder expanded after rename`.

## Pull requests

1. Branch from `main` with a short name: `feat/...`, `fix/...` or `chore/...`.
2. Keep the change focused and add tests for new logic and for every bug fix.
3. Make sure `pnpm check` passes and add an entry under "Unreleased" in `CHANGELOG.md` for user-visible changes.
4. Open the PR using the template. Pull requests are merged by squash.

By contributing, you agree that your work is licensed under GPL-3.0-only.
