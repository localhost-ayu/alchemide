# Snippets

Snippets appear in the autocomplete list while you type. Pick one with `Enter` or a click, then
press `Tab` and `Shift+Tab` to move between its fields.

## Built-in packs

Each pack is turned on or off in the settings (`Ctrl+,`, **Snippets**). The language packs are on
by default; the framework packs start off so their prefixes do not crowd the list.

| Pack                      | Languages        | Example prefixes                                           | On by default |
| ------------------------- | ---------------- | ---------------------------------------------------------- | ------------- |
| PHP                       | PHP              | `php`, `class`, `pubf`, `ctor`, `foreach`, `match`, `try`  | yes           |
| JavaScript and TypeScript | JS, TS, JSX, TSX | `log`, `fn`, `arrow`, `imp`, `forof`, `fetchj`, `test`     | yes           |
| Rust                      | Rust             | `main`, `fn`, `fnr`, `struct`, `match`, `tmod`             | yes           |
| Python                    | Python           | `main`, `def`, `class`, `dc`, `with`, `test`               | yes           |
| Go                        | Go               | `main`, `fn`, `meth`, `iferr`, `forr`, `test`              | yes           |
| Node.js                   | JS, TS           | `nimp`, `dirname`, `readfile`, `amain`, `express`          | no            |
| React                     | JSX, TSX         | `rfc`, `rfcp`, `us`, `ue`, `um`, `rmap`                    | no            |
| Next.js                   | JS, TS, JSX, TSX | `npage`, `nlayout`, `nroute`, `nuc`, `nsa`, `nerror`       | no            |
| Laravel                   | PHP (and Blade)  | `lr-controller`, `lr-route`, `lr-model`, `lr-validate`     | no            |
| CodeIgniter 3             | PHP              | `ci3-controller`, `ci3-model`, `ci3-view`, `ci3-get`       | no            |
| CodeIgniter 4             | PHP              | `ci4-controller`, `ci4-model`, `ci4-route`, `ci4-validate` | no            |

The packs live in `src/lib/snippetPacks/` in the same format as your own snippets.

## Your snippets

Put files in the `snippets` folder inside the app config folder (`%APPDATA%\alchemide\snippets`
on Windows, `~/.config/alchemide/snippets` on Linux). The format is the one VS Code uses:

- `php.json`, `typescriptreact.json`, `rust.json`…: snippets for one language, named with the
  VS Code language id. `blade` counts as PHP.
- `*.code-snippets`: snippets for any language; each snippet may have a `scope` such as
  `"javascript,typescript"`.

```json
{
  "Dump": {
    "prefix": ["dd", "dump"],
    "body": ["dd(\\$${1:var});", "$0"],
    "description": "Dump and die"
  }
}
```

Comments and trailing commas are allowed. Run **Reload snippets** from the command palette after
editing a file. A broken file is listed in the settings and skipped.

**Import snippets from VS Code** (command palette or settings) copies the files from VS Code's
user snippets folder. It never overwrites a file of yours: a file with the same name and different
content is saved as `vscode-<name>`.

## Supported syntax

- Tab stops `$1`, `${1}`, `$0` (final cursor) and placeholders `${1:default}`; repeated numbers
  are edited together.
- Choices `${1|one,two|}` insert the first option.
- Variables `$TM_FILENAME`, `$TM_FILENAME_BASE`, `$TM_DIRECTORY`, `$TM_FILEPATH`,
  `$CURRENT_YEAR`, `$CURRENT_MONTH`, `$CURRENT_DATE`, `$CURRENT_HOUR`, `$CURRENT_MINUTE`,
  `$CURRENT_SECOND`, `$CURRENT_MONTH_NAME`, `$CURRENT_DAY_NAME` (and the `_SHORT` forms),
  `$CURRENT_SECONDS_UNIX`, `$UUID`, `$LINE_COMMENT`, `$BLOCK_COMMENT_START`, `$BLOCK_COMMENT_END`;
  `${VAR:default}` for a fallback.
- Transforms `${TM_FILENAME_BASE/(.*)Controller/${1:/downcase}/}` with `upcase`, `downcase`,
  `capitalize`, `pascalcase` and `camelcase`.
- Not supported: `$TM_SELECTED_TEXT` and `$CLIPBOARD` insert nothing, transforms on tab stops are
  ignored, and a placeholder containing braces or line breaks becomes an empty field.
