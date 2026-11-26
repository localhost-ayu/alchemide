# Themes

A theme is a JSON file. Built-in themes live in `src/features/themes/builtin/`.

```json
{
  "name": "Catalisador",
  "mood": "laboratorio",
  "ui": {
    "bg": "#120f1a",
    "panel": "#1b1726",
    "accent": "#b6f24a",
    "accent2": "#ff7ac6",
    "text": "#e9e4f5"
  },
  "syntax": {
    "keyword": "#ff7ac6",
    "string": "#b6f24a",
    "function": "#ffc857",
    "comment": "#857b9f",
    "variable": "#c9b8ff",
    "type": "#7ad7ff",
    "number": "#ffa36c"
  },
  "background": {
    "type": "gradient",
    "css": "radial-gradient(circle at 80% 110%, #2b1f45 0%, #120f1a 55%)"
  },
  "glass": { "panelOpacity": 0.78, "blur": 12 },
  "mascot": {
    "path": "mascots/mascot.png",
    "corner": "bottom-right",
    "opacity": 0.35,
    "size": 280
  },
  "effects": { "surface": "glass", "background": true, "mascot": true, "animations": true }
}
```

## Fields

| Field        | Required | Notes                                                                                                                                                 |
| ------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`       | yes      | Shown in the mood picker                                                                                                                              |
| `mood`       | no       | Free text used to group themes                                                                                                                        |
| `ui`         | yes      | Hex colors: `bg`, `panel`, `accent`, `accent2`, `text`                                                                                                |
| `syntax`     | yes      | Hex colors: `keyword`, `string`, `function`, `comment`, `variable`; optional `type` (defaults to `ui.accent2`) and `number` (defaults to `ui.accent`) |
| `background` | no       | See below. Defaults to a solid `ui.bg`                                                                                                                |
| `glass`      | no       | `panelOpacity` from 0.2 to 1 (default 0.78), `blur` in px from 0 to 40 (default 12)                                                                   |
| `mascot`     | no       | `path`, `corner` (`top-left`, `top-right`, `bottom-left`, `bottom-right`), `opacity` 0–1, `size` 32–1024 px                                           |
| `effects`    | no       | Initial effects when the theme is chosen                                                                                                              |

### Backgrounds

| `type`           | Fields                                                                             |
| ---------------- | ---------------------------------------------------------------------------------- |
| `solid`          | `color`                                                                            |
| `gradient`       | `css`: a single `linear-`, `radial-` or `conic-gradient(...)`; `url()` is rejected |
| `image`, `video` | `path`, `fit` (`cover` or `contain`), `blur` 0–40 px, `dim` 0–1                    |

Image, video and mascot paths are relative to the app config folder (`%APPDATA%\alchemide` on
Windows, `~/.config/alchemide` on Linux). Absolute paths and `..` are rejected, and those files
never ship with the app.

## Validation

A theme that is not an object, has no name, or lacks a required `ui` or `syntax` color is
replaced by the built-in reserve theme, and a warning is shown. Invalid optional fields fall back
to their defaults with a warning; numbers out of range use the default silently.

## How a theme is applied

Every color becomes a CSS variable on `<html>` (`--color-bg`, `--syntax-keyword`, …), and
derived tokens in `src/styles/tokens.css` mix them for borders, hover and selection. The
CodeMirror highlight style points at the `--syntax-*` variables, so switching themes changes
only CSS: no editor reconfiguration and no React re-render.

## Effects

Each effect is an attribute on `<html>`, switched independently:

| Attribute         | Values           | Behavior                                                                             |
| ----------------- | ---------------- | ------------------------------------------------------------------------------------ |
| `data-surface`    | `glass`, `solid` | Translucent panels with backdrop blur, or opaque panels (the light mode)             |
| `data-background` | `true`, `false`  | Shows or hides the background; with `solid`, it shows only behind the editor, dimmed |
| `data-mascot`     | `true`, `false`  | Shows the mascot in a corner of the editor                                           |
| `data-animations` | `true`, `false`  | Transitions and micro-animations; `prefers-reduced-motion` also turns them off       |
