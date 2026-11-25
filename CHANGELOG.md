# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Desktop app scaffold with an empty layout: explorer, editor and status bar
- Environment badge in the status bar: Windows, Linux or WSL with the distro name
- Open a project folder from the explorer with the native dialog
- Collapsible file tree (`Ctrl+B`) that loads folders on demand and respects `.gitignore`
- The file tree updates when files change on disk
- CodeMirror editor with syntax highlighting chosen by file extension: PHP, JavaScript, TypeScript, JSX/TSX, SQL, Markdown, HTML, CSS and JSON; other files open as plain text
- Tabs with an unsaved indicator, `Ctrl+S` to save, `Ctrl+W` to close and a warning before closing unsaved work; files keep their line endings and BOM
- Browser mode with a mocked backend (`pnpm dev:web`) and a Linux dev container
