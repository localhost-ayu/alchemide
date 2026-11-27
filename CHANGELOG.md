# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Your own themes: JSON theme files in the `themes` folder of the config folder appear in the mood picker and in the settings next to the built-in themes; broken files are skipped with a warning, and "Reload your themes" picks up new files
- Duplicate, import, export and delete themes from the command palette or the settings; imported themes are validated and get a numbered name when theirs is taken

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

[Unreleased]: https://github.com/localhost-ayu/alchemide/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/localhost-ayu/alchemide/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/localhost-ayu/alchemide/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/localhost-ayu/alchemide/releases/tag/v0.1.0
