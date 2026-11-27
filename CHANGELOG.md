# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.10.0] - 2026-11-27

Languages: the interface, commands and error messages in Brazilian Portuguese or English, chosen in Settings → General (it follows the system by default).

### Changed

- Error messages from the backend (files, Git, Docker, terminal, updates…) follow the interface language too
- The whole interface is available in Brazilian Portuguese: menus, commands, panels, settings, the theme editor, the Git dock, Docker, search, the terminal and messages

### Fixed

- A Docker container being stopped showed "stoping…"
- The mood picker showed some group names in Portuguese while the rest was in English

## [0.9.0] - 2026-11-27

File operations: create, rename and delete files and folders from the explorer.

### Added

- Interface language: Settings → General → Language (System, Português (Brasil), English), switched live. System follows the operating system language

### Added

- Rename (`F2`) and delete (`Delete`, to the system trash after a confirmation) from the explorer, with a right-click menu that also has New file, New folder and Copy path. Open tabs follow a rename and close on delete

### Added

- Create files and folders from the explorer: buttons in its header, or `Ctrl+N` for a new file. The name is typed in the tree, inside the selected folder; `utils/date.ts` also creates the folder. A new file opens in the editor, and an existing name is refused

## [0.8.0] - 2026-11-27

Appearance and comfort: readable code over wallpapers, a draggable mascot, a menu bar that hides itself, branch switching and inline blame, SQL snippets and smaller touches.

### Added

- Inline blame: the end of the cursor line shows who last changed it and when (`Ana, 10 months ago`), with the commit subject on hover; Settings → Editor turns it off
- Menu bar with every command by category (File, Edit, View, Go, Terminal, Git, Theme, Help) and its shortcut. It hides itself by default and shows with a quick Alt tap or with the pointer at the top edge; Settings → Layout switches it to always visible or hidden
- Switch branches from the Git dock: local branches and remote ones without a local copy
- A terminal button in the bottom right corner of the status bar opens and hides the terminal
- A button at the end of the tab bar opens and closes the preview of Markdown files
- SQL snippet pack (on by default: `sel`, `ij`, `lj`, `cte`, `ins`, `upd`, `case`, `rownum`…) and a SQL Server pack (`top`, `page`, `lasth`, `decl`, `trycatch`, `merge`, `temp`…), turned on in Settings → Snippets
- The mascot can be unlocked and dragged anywhere in the editor (double click sends it back to its corner), drawn behind the code (new default) or in front of it, and an animated GIF stands still when animations are off
- What sits behind open files over a wallpaper: a dimmed, blurred layer (new default, the wallpaper stays sharp with no file open), the wallpaper as it is, or the theme color. Adjustable in the theme editor under Background
- Option in Settings → General to close panels by clicking outside them (off by default)
- Tabs of files that share a name show the folder that tells them apart (`conexao.php · beer`)

### Changed

- The settings button in the activity bar opens "Settings…" and the same menus, by category
- The "Glass panels" switch moved from Settings to the theme editor, next to the glass opacity and blur, with a live preview
- The "Open a file" hint stays readable over a wallpaper
- Settings use toggle switches in the theme accent color instead of checkboxes

### Fixed

- Git dock errors (a failed stage, commit or switch) no longer vanish right after they appear

## [0.7.0] - 2026-11-27

Workspace, terminal and Git: resizable panels, a customizable terminal, open file and folder shortcuts, Esc closes panels, settings search and general section, editable keyboard shortcuts, and a Git dock with diffs, history, stage and commit.

### Added

- Keyboard shortcuts in the settings: record a new shortcut (one key or a two-step chord), remove it or reset it; shortcuts used by more than one command are flagged
- Git dock on the right (small tab or `Ctrl+Shift+G`): changed files with their diff, stage and unstage per file, stage all, commit with a message (`Ctrl+Enter`), and the history with the diff of each commit

### Added

- `Ctrl+O` opens a single file with the system dialog, even outside the open folder; `Ctrl+K Ctrl+O` opens a folder. Both are in the command palette
- Resize the sidebar and the terminal by dragging their edge (or with the arrow keys on the focused edge); sizes are remembered and a double click restores the default
- Terminal settings: follow the theme or use one of four palettes (Reagent, Midnight ink, Paper, Ember), its own font and line height, cursor shape and blinking, padding, scrollback lines and a visual bell; changes apply to open terminals right away
- Search in the settings: type to filter every option, accents and word order do not matter
- General settings: reopen the last folder on start (on by default)

### Changed

- `Esc` closes the open panel (settings, theme editor, palettes and pickers) from anywhere, not only when the focus is inside it; with no panel open, `Esc` still reaches the editor and the terminal

### Fixed

- The terminal uses the theme's panel color instead of a transparent background, which showed black on Linux, and keeps black and white text readable on light themes

## [0.6.2] - 2026-11-27

Patch release: select fields are readable in every theme on Linux and WSL.

### Fixed

- Select fields (theme, tab size, zoom, new terminal) are readable in every theme on Linux: they get an opaque background and a text color chosen for contrast, and native widgets follow the theme's light or dark scheme

## [0.6.1] - 2026-11-27

Patch release: code blocks in the Markdown preview get their colors on slow or busy machines too.

### Fixed

- The first line of a code block in the Markdown preview no longer stays without colors on a slow or busy machine

## [0.6.0] - 2026-11-27

Layout and Docker: a containers panel, an activity bar, hideable bars and zen mode.

### Added

- Activity bar to switch between Explorer, Search and Docker; clicking the open view collapses the side bar
- Hide the activity bar, status bar or editor tabs from the command palette or Settings → Layout; the layout and the open side bar view are remembered
- Zen mode (`Ctrl+K Z`) hides everything but the editor until you press it again
- Docker panel (`Ctrl+Shift+D`): running and stopped containers grouped by Compose project, with start, stop and restart, and logs followed in a new terminal tab; refreshes every 5 seconds while visible and shows a short notice when Docker is missing or not running

## [0.5.0] - 2026-11-27

VS Code bridge: import VS Code themes, bundled code fonts and interface zoom, Rust, Python and Go, snippets in the VS Code format with built-in packs, and more control over the look.

### Added

- Six bundled code fonts licensed under the SIL OFL: Maple Mono (now the default), JetBrains Mono,
  Adwaita Mono, Fira Code, Cascadia Code and IBM Plex Mono, plus "Installed font…" for any font on
  the system
- Terminal font size, line height, ligatures on or off and interface zoom in the settings, with a
  live font sample
- Zoom in, zoom out and reset zoom: `Ctrl+=`, `Ctrl+-`, `Ctrl+0`
- Snippets in the VS Code format in the autocomplete, with tab stops, choices, variables and
  transforms. Your files go in the `snippets` config folder; "Import snippets from VS Code" copies
  VS Code's user snippets without overwriting anything
- Built-in snippet packs for PHP, JavaScript/TypeScript, Rust, Python and Go (on by default) and
  Node.js, React, Next.js, Laravel, CodeIgniter 3 and CodeIgniter 4 (turned on in the settings)
- Rust, Python and Go: syntax highlighting in the editor (`.rs`, `.py`, `.pyw`, `.pyi`, `.go`) and
  in Markdown code blocks

## [0.4.0] - 2026-11-27

Language servers: autocomplete, hover, inline errors and go to definition for PHP, JavaScript/TypeScript and SQL, when the servers are installed.

### Added

- Language servers: autocomplete, hover, inline errors and go to definition (`F12`, also across
  files) for PHP (Intelephense), JavaScript/TypeScript/JSX/TSX (`typescript-language-server`)
  and SQL (`sqls`). Servers are found on `PATH`; when one is missing, the status bar shows how to
  install it instead of an error
- "Restart language servers" in the command palette

## [0.3.0] - 2026-11-27

Theme editor release: your own themes, a theme library, a visual theme editor with live preview and sliders for glass, background and mascot.

### Added

- Your own themes: JSON theme files in the `themes` folder of the config folder appear in the mood picker and in the settings next to the built-in themes; broken files are skipped with a warning, and "Reload your themes" picks up new files
- Theme editor (`Ctrl+K E`): color pickers for every interface and syntax color with a live preview, contrast hints against the background, and saving built-in themes as a new theme of yours
- Sliders in the theme editor for panel opacity and glass blur, background dim, blur and fit, and mascot opacity, size and corner, all previewed live
- Duplicate, import, export and delete themes from the command palette or the settings; imported themes are validated and get a numbered name when theirs is taken
- Theme editor: starting points from the built-in themes, corner roundness with presets, an interface font (System, Rounded, Editorial or Terminal), and a suggested panel opacity when a background image makes the text hard to read
- Theme editor: "Undo changes" and "Defaults" buttons, and your last saved colors offered in every color picker
- Import VS Code color themes: pick one of the themes installed in VS Code or any VS Code theme file, and it becomes a theme of yours with the closest interface and syntax colors

## [0.2.1] - 2026-11-27

Patch release: palettes follow the highlighted item, and the README explains the two Windows installers.

### Changed

- The README explains the two Windows installers and recommends the MSI (per machine, in
  `Program Files`) on work machines with endpoint protection

### Fixed

- Quick open, the command palette and the mood picker scroll with the highlighted item when you move past the visible list with the arrow keys

## [0.2.0] - 2026-11-26

Productivity release. From this version on, Alchemide updates itself; users of 0.1.0 install 0.2.0 by hand once.

### Added

- Command palette (`Ctrl+Shift+P`) listing every action with its shortcut, with fuzzy search
- Quick open (`Ctrl+P`): fuzzy search over the project's file names, respecting `.gitignore`
- Find and replace across the project (`Ctrl+Shift+F`): plain text or regex, match case, results streamed as they are found, replace only the matches you keep selected; open tabs reload and tabs with unsaved changes are left alone
- Settings screen (`Ctrl+,`): editor font, font size and tab size, theme and each effect, saved in the config folder
- Automatic updates from GitHub Releases, verified with a signature, with a notice to install and restart; "Check for updates" in the command palette and a setting to turn the check off

### Fixed

- The environment badge shows `WSL · <distro>` when the Windows app opens a folder inside WSL

## [0.1.0] - 2026-11-26

First release: a lightweight editor for Windows and Linux (including WSL) with mood themes.

### Added

#### Editor

- Open a project folder with the native dialog
- Collapsible file tree (`Ctrl+B`) that loads folders on demand, respects `.gitignore` and updates when files change on disk
- CodeMirror editor with syntax highlighting chosen by file extension: PHP, JavaScript, TypeScript, JSX/TSX, SQL, Markdown, HTML, CSS and JSON; other files open as plain text
- Tabs with an unsaved indicator, `Ctrl+S` to save, `Ctrl+W` to close and a warning before closing unsaved work; files keep their line endings and BOM
- Status bar with the environment (Windows, Linux or WSL with the distro), cursor position, line count, encoding, line endings and language

#### Themes and effects

- Built-in themes by mood: Catalisador (default), Férreas (Ferrugem, Cobre, Aço), Calmas (Maré, Musgo) and Pastéis (Lavanda, Menta, Pêssego), all with WCAG AA contrast for code
- JSON theme format; invalid themes fall back to a reserve theme with a warning
- Independent effects (glass or solid surface, background, mascot, animations) and the Laboratório, Focado and Só wallpaper presets; animations also follow `prefers-reduced-motion`
- Mood picker (`Ctrl+K M`) with live preview of themes and presets; the choice is remembered
- Your own background (image or video) and mascot, stored in the config folder; `Ctrl+Alt+M` toggles the mascot
- Lab touches: a bubbling flask while work is in progress, "Experiment #N saved" messages and a soft glow on save, all off together with animations

#### Terminal

- Built-in terminal panel (`` Ctrl+` ``) with tabs, resizing with the window
- PowerShell on Windows, your `$SHELL` on Linux, and WSL profiles; projects inside WSL open straight in their distro
- Terminal colors follow the theme, with a reagent-green cursor while animations are on

#### Markdown

- Preview side by side (`Ctrl+Shift+V`) with GFM tables and task lists, following unsaved edits and the editor's scroll
- Code blocks highlighted with shiki in the current theme's colors
- The preview never runs scripts or raw HTML, loads remote images only when asked and opens links in the system browser

#### Development

- Browser mode with a mocked backend (`pnpm dev:web`) and a Linux dev container

[Unreleased]: https://github.com/localhost-ayu/alchemide/compare/v0.10.0...HEAD
[0.10.0]: https://github.com/localhost-ayu/alchemide/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/localhost-ayu/alchemide/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/localhost-ayu/alchemide/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/localhost-ayu/alchemide/compare/v0.6.2...v0.7.0
[0.6.2]: https://github.com/localhost-ayu/alchemide/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/localhost-ayu/alchemide/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/localhost-ayu/alchemide/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/localhost-ayu/alchemide/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/localhost-ayu/alchemide/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/localhost-ayu/alchemide/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/localhost-ayu/alchemide/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/localhost-ayu/alchemide/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/localhost-ayu/alchemide/releases/tag/v0.1.0
