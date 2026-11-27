# Themes

A theme is a JSON file. Built-in themes live in `src/features/themes/builtin/`; your own themes
live in the `themes/` folder of the app config folder (see [Your own themes](#your-own-themes)).

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

## Your own background and mascot

The mood picker (`Ctrl+K M`) has actions to choose a background image or video and a mascot
image, and to remove them. The chosen file is copied into `backgrounds/` or `mascots/` in the
config folder with a sanitized name, and the settings keep only that relative path. A custom
background or mascot overrides the one of the current theme and stays when you switch themes.

| Kind       | Formats                                       | Limit  |
| ---------- | --------------------------------------------- | ------ |
| Background | PNG, JPEG, WebP, GIF, MP4, WebM               | 100 MB |
| Mascot     | PNG, WebP, GIF (transparent images work best) | 100 MB |

Videos play muted in a loop and pause while animations are off. `Ctrl+Alt+M` shows or hides the
mascot.

## Your own themes

Put theme files in `themes/` inside the config folder (`%APPDATA%lchemide	hemes` on Windows,
`~/.config/alchemide/themes` on Linux), one theme per `.json` file. They show up under "Meus temas"
in the mood picker and under "Your themes" in the settings, next to the built-in themes.

- Themes are read when the app starts and with "Reload your themes" in the command palette.
- A file that is not a valid theme is skipped with a warning; it never replaces your current look.
- Names must be unique, ignoring case. A theme named like a built-in theme, or like a theme in an
  earlier file (files are read in alphabetical order), is skipped with a warning.
- Built-in themes are read-only.

### Duplicate, import, export and delete

These actions are in the command palette (`Ctrl+Shift+P`) and next to the theme in the settings
(`Ctrl+,`). All of them act on the current theme, except import.

| Action                  | What it does                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| Duplicate current theme | Saves a copy named `<name> copy` as your theme and switches to it                                      |
| Import theme…           | Picks a `.json` file (up to 1 MB), validates it and saves it as your theme; a taken name gets a number |
| Export current theme…   | Saves the current theme as a `.json` file wherever you choose                                          |
| Delete current theme    | After confirming, removes your theme's file and switches to the default theme                          |

Your custom background and mascot are not part of a theme, so they are not exported.
