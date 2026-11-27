# 0013. Interface languages

- Status: accepted
- Date: 2026-11-27

## Context

Every interface text was written in English inside the components. The user works in Brazilian
Portuguese and asked for a language selector. The repository itself (code, commits, docs) stays
in English.

## Decision

- A small module of our own, `src/lib/i18n.ts`, instead of a library: the needs are plain strings
  with `{placeholders}` and two languages. `src/lib/locales/en.ts` defines the keys; every other
  dictionary is typed as `Record<MessageKey, string>`, so a missing translation does not compile.
  A test checks that each translation keeps the placeholders of its English text.
- `useT()` gives components a translate function that re-renders them when the language changes;
  `t()` is for code outside React. The language lives in a zustand store in `lib`, so features do
  not depend on the settings feature.
- Settings → General → Language: System (default), Português (Brasil), English, saved as
  `general.language`. System picks Portuguese when any of the system languages starts with `pt`,
  English otherwise. The change is live, and `<html lang>` follows it.
- Theme names (and the mood collections Laboratório, Férreas, Calmas, Pastéis), effect preset
  names, snippet descriptions and file contents are not translated.
- Command titles are translated where they are registered; each registering effect depends on
  `t`, so menus, the palette and the shortcut list switch with the language. Effects that also
  subscribe to events keep the commands in a separate effect, so a language change does not
  resubscribe.

## Consequences

- New texts go through `t()` with a key in both dictionaries.
- Adding a language is one new dictionary and one entry in `LANGUAGE_PREFERENCES`.
- Errors from Rust are still English text until they carry a code (issue #146).
