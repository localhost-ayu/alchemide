# 0010. Layout store and hideable parts

- Status: accepted
- Date: 2026-11-26

## Context

The side bar's state lived in `App` as React state, so it was lost on restart and nothing else
could read it. The goal is a minimal window in the spirit of Zed: an activity bar, a collapsible
side bar, and status bar and tabs that can be hidden, all remembered.

## Decision

- One small zustand store, `src/lib/layoutStore.ts`, holds the side bar view, whether it is open,
  and whether the activity bar, status bar and editor tabs are shown. It is saved under `layout`
  in `settings.json` and every field is validated on read, like the editor settings.
- Zen mode is a flag in the same store but is never saved.
- Hiding is done by `App` with `data-*` attributes on the root grid and CSS. Features (editor,
  status bar, side bar views) do not read the layout store, so no feature depends on another or on
  the layout; the editor tab strip is hidden by a CSS rule on its `role="tablist"`.
- The grid widths are CSS variables (`--activity-width`, `--sidebar-width`, `--statusbar-height`)
  set to `0px` when a part is hidden, which keeps one grid definition.
- Icons are inline SVG in `ActivityBar.tsx` instead of an icon package: four icons do not justify a
  dependency.

## Consequences

- New side bar views only need an entry in `SIDEBAR_VIEWS`, an icon and a panel in `App`.
- The side bar width is still fixed at 260 px; resizing is left for later.
