# Alchemide

A lightweight, mood-themed code editor built with Tauri, React and CodeMirror.

![screenshot](docs/screenshot.png)

## Features

- Syntax highlighting for PHP, JavaScript, TypeScript, JSX/TSX, SQL, Markdown, HTML and CSS
- Collapsible file explorer that respects `.gitignore`
- Minimal layout: activity bar, collapsible side bar, hideable status bar and tabs, and zen mode
- Built-in terminal with automatic Windows, Linux and WSL profiles
- Docker panel: running and stopped containers, start, stop, restart and logs without opening Docker Desktop
- Markdown preview
- Themes by mood, custom backgrounds and independent visual effects

## Install

Download the installer for your system from [Releases](../../releases).

Windows builds are not code-signed yet, so SmartScreen may show a warning on first install.

## Development

Requirements: Rust (stable), Node LTS, pnpm and the [Tauri prerequisites](https://tauri.app/start/prerequisites/).

```bash
pnpm install
pnpm dev        # desktop app
pnpm dev:web    # UI only, in the browser, with a mocked backend
pnpm check      # lint, typecheck and tests
```

A dev container with the Linux toolchain lives in `.devcontainer/`.
Architecture notes and decisions are in [`docs/`](docs/).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[GPL-3.0-only](LICENSE). Use of the app is also subject to the [Terms of Use](TERMS.md).
