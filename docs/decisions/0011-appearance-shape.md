# 0011. Shape and interface font in the theme

- Status: accepted
- Date: 2026-11-27

## Context

The goal is customization in the spirit of the appearance menu of the author's other project,
save-state: anyone can make the app their own from one panel, without touching CSS. The theme
editor (M6) already covered colors, glass, background and mascot. Missing were corner roundness,
the interface font, starting points and help keeping text readable over a background image.

## Decision

- `shape` (`radius`, `font`) is an optional part of the theme, so a theme file carries its whole
  look and old files stay valid with the defaults (8 px, system font).
- Every stylesheet uses `--radius` and `--radius-sm` (half) instead of fixed pixel values; the
  theme sets both.
- The interface fonts are system font stacks (`system-ui`, `ui-rounded`, `ui-serif`) plus the code
  font. No font package is added for the interface; on systems without a rounded or serif face
  the stack falls back gracefully.
- Starting points reuse the built-in themes instead of a separate preset list, so there is one
  set of looks to maintain.
- The readability check is a pure function: panel text over the panel color composited at its
  opacity on black and on the brightest the image can be after its dim. It suggests, never
  changes the opacity by itself.

## Consequences

- Built-in themes keep the default shape for now; giving them distinct shapes is a later choice.
- The rounded and serif stacks look different on Windows, macOS and Linux.
