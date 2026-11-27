# 0006. Bundled fonts and interface zoom

- Status: accepted
- Date: 2026-11-26

## Context

Until 0.2.0 the code font was a free-text field: it only worked when the font was installed on
the system, so the suggested default (Maple Mono) usually fell back to another font. The user
asked for a choice of fonts such as Adwaita Mono and JetBrains Mono, sizes for each part of the
app and more control over how text looks.

## Decision

- Six monospace fonts licensed under the SIL OFL 1.1 ship with the app: Maple Mono (default),
  JetBrains Mono, Adwaita Mono, Fira Code, Cascadia Code and IBM Plex Mono. They come from the
  `@fontsource/*` npm packages, which carry the license and pre-split `woff2` files; no font file
  is copied into the repository by hand. Copyright lines are in `THIRD_PARTY_NOTICES.md`.
- Only Latin and Latin Extended subsets in regular and bold are imported (about 1.1 MB in
  total), and each font's CSS is a dynamic `import()`, so only the chosen font is loaded.
- "Installed font…" keeps the old behavior for any font on the system.
- New settings in the `editor` object of `settings.json`: `terminalFontSize`, `lineHeight`,
  `ligatures` and `zoom`. Older files keep working; missing fields use their defaults, and an
  empty `fontFamily` now means Maple Mono.
- Interface size is a zoom of the whole webview, set from Rust (`set_zoom`, clamped to
  70–160 %), instead of a CSS font size. Components use pixel sizes, and CSS `zoom` would confuse
  CodeMirror's cursor measurements; the native webview zoom scales everything consistently.
  `Ctrl+=`, `Ctrl+-` and `Ctrl+0` step through fixed levels.

## Consequences

- The installers grow by about 1.1 MB.
- Adding a font is one entry in `src/lib/fonts.ts`, one dependency and one line in the notices.
- Terminal ligatures are not supported yet (xterm.js needs an extra addon).
