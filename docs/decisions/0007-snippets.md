# 0007. Snippets in the VS Code format

- Status: accepted
- Date: 2026-11-26

## Context

M8 brings over what the user relied on in VS Code: snippets of her own and snippets for the
stacks she works with (PHP, Laravel, CodeIgniter 3 and 4, JS, Node.js, React, Next.js, Rust,
Python, Go). Snippet extensions on the marketplace have mixed licenses, and CodeMirror has its own
snippet syntax.

## Decision

- The file format is VS Code's (`<language>.json` and `.code-snippets`), read with a small JSONC
  parser (`src/lib/jsonc.ts`, also needed for VS Code themes). Users can copy files over as they
  are, and the built-in packs use the same format.
- The VS Code body syntax is parsed in `src/lib/snippets.ts` and converted to a CodeMirror
  template when the snippet is applied, so file and date variables are current. CodeMirror fields
  cannot hold braces or line breaks; such placeholders become empty fields.
- Built-in packs are written from scratch for this project, not copied from extensions. Language
  packs are on by default; framework packs start off to keep the list short, and the choice is
  saved in `settings.json` (`snippets.packs`).
- Snippets join the autocomplete through `EditorState.languageData`, next to the language's own
  completions and the language server's, with a lower rank.
- Rust only reads `<config>/snippets/` and copies from VS Code's user snippets folder; it never
  overwrites an existing file. `@codemirror/autocomplete` becomes a direct dependency (it was
  already installed through the language packages) because the editor now imports it.

## Consequences

- No marketplace installs and no network: "extensions" from VS Code are limited to snippet files.
- Adding a pack is one JSON file and one line in `src/lib/snippetPacks/index.ts`.
