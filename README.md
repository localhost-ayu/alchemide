# Alchemide

A lightweight, mood-themed code editor built with Tauri, React and CodeMirror.

![screenshot](docs/screenshot.png)

## Features

- Syntax highlighting for PHP, JavaScript, TypeScript, JSX/TSX, SQL, Markdown, HTML, CSS, JSON,
  Rust, Python and Go
- Collapsible file explorer that respects `.gitignore`
- Built-in terminal with automatic Windows, Linux and WSL profiles
- Docker panel: running and stopped containers, start, stop, restart and logs without opening Docker Desktop
- Markdown preview
- Autocomplete, hover, inline errors and go to definition (`F12`) through language servers you
  install: Intelephense (PHP), `typescript-language-server` (JS/TS/React) and `sqls` (SQL)
- Six bundled code fonts (Maple Mono, JetBrains Mono, Adwaita Mono, Fira Code, Cascadia Code,
  IBM Plex Mono) or any installed font; separate sizes for the editor and the terminal, line
  height, ligatures and interface zoom (`Ctrl+=`, `Ctrl+-`, `Ctrl+0`)
- Snippets in the VS Code format: your own files, an import from VS Code and built-in packs for
  PHP, Laravel, CodeIgniter 3 and 4, JS/TS, Node.js, React, Next.js, Rust, Python and Go
  ([docs/snippets.md](docs/snippets.md))
- Themes by mood, custom backgrounds and independent visual effects

## Install

Download the installer for your system from [Releases](../../releases).

On Windows there are two installers:

- `Alchemide_<version>_x64_en-US.msi` installs for every user in `Program Files` and needs
  administrator rights. Prefer it on work machines with endpoint protection, which tends to
  flag unsigned programs running from a user folder.
- `Alchemide_<version>_x64-setup.exe` installs only for you in `%LOCALAPPDATA%`, without
  administrator rights.

Windows builds are not code-signed yet, so SmartScreen may show a warning on first install, and
endpoint protection such as SentinelOne may block the app until it is allowed by your IT team.

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
