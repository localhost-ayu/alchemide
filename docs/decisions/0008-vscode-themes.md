# 0008. Importing VS Code color themes

- Status: accepted
- Date: 2026-11-26

## Context

Many users already have a favorite VS Code color theme, either one that ships with VS Code or one
from an extension. Rewriting it by hand in the theme editor is tedious. A VS Code theme has far
more colors than an Alchemide theme (hundreds of workbench keys and TextMate scope rules against
five interface colors and seven syntax colors), so it cannot be used as is.

## Decision

- Importing is a one-time conversion into a normal user theme file. Alchemide does not run VS Code
  themes, keep them in sync or read them on every start. After the import the theme is edited,
  exported and deleted like any other theme of yours.
- Rust finds the installed themes: the extensions bundled with VS Code (including the newer
  versioned folder `Microsoft VS Code\<commit>\resources\app\extensions`) and the user's
  `~/.vscode/extensions`. It reads each extension's `package.json` `contributes.themes`,
  translates `%key%` labels through `package.nls.json`, and keeps only `.json` files that exist.
  TextMate `.tmTheme` (plist) themes are not supported.
- Rust also loads a theme: it strips JSONC comments and trailing commas and follows `include`
  up to five levels, the way VS Code merges them (the including theme's colors win, token rules
  are appended). `load_vscode_theme` only accepts a path from the installed listing, so the
  webview cannot use it to read other files; any other file goes through the open dialog.
- The frontend maps the merged theme (`fromVscodeTheme`):
  - `bg` from `editor.background`; `panel` from the side bar, the tab strip or the activity bar;
    `accent` from `focusBorder` or the button color; `accent2` from the activity bar badge when
    it differs from the accent, otherwise the keyword color; `text` from `editor.foreground`.
  - Each syntax color uses the token rule that matches a list of scopes best: the longest
    matching selector wins, a descendant selector (`source.php variable`) counts a little less,
    and the later rule wins ties, as in VS Code.
  - Colors with alpha are made opaque; missing colors fall back to the text color.
  - The result is validated by the same rules as any other theme before it is saved.
- An imported theme uses solid panels and no background image or mascot, since VS Code themes have
  none; the user can turn effects on afterwards.

## Consequences

- No new dependency: JSONC is handled by a small stripper in Rust.
- The mapping is approximate by design. Themes with unusual scope names may get a syntax color that
  differs from VS Code; the theme editor fixes that in a few clicks.
- Themes installed in VS Code forks (VSCodium, Cursor) are not listed; their files can still be
  imported with "Import VS Code theme file…".
