# 0004. User themes in the config folder

- Status: accepted
- Date: 2026-11-26

## Context

Until 0.2.0 the only themes were the built-in ones, and `settings.json` kept just the chosen
theme's name. The theme editor (M6) needs somewhere to keep themes the user creates, duplicates
or imports, and the theme format is meant to be shared as plain JSON.

## Decision

- Each user theme is its own JSON file in `themes/` inside the app config folder
  (`%APPDATA%\alchemide\themes` on Windows, `~/.config/alchemide/themes` on Linux), in the same
  format as the built-in themes.
- Rust lists, writes and deletes those files (`list_user_themes`, `save_user_theme`,
  `delete_user_theme`) and accepts only a plain `*.json` file name inside that folder. A new
  theme's file name comes from its name, lowercased and sanitized like imported assets, with a
  number added when it already exists. Writes go through a temporary file and a rename.
- Rust does not validate the theme beyond "a JSON object with a name". The frontend validates
  every file with the same rules as the built-in themes. A file that fails is skipped with a
  warning instead of falling back to the reserve theme, so one broken file never changes the
  user's look.
- Theme names are unique, ignoring case and surrounding spaces. A user theme whose name is
  already taken, by a built-in theme or by an earlier file, is skipped with a warning.
- The chosen theme is still remembered by name. If its file disappears, the default theme is used.
- Themes are read on start and with "Reload your themes" in the command palette. The folder is
  not watched.

## Consequences

- Themes can be shared, backed up or edited by hand as single files, and dropping a file into the
  folder is enough to install one.
- Renaming a theme by hand keeps the file name; that is fine, since only the name is shown.
- Built-in themes stay read-only. Changing one means saving a copy as a user theme.
