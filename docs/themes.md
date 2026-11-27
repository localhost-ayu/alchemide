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

| Field        | Required | Notes                                                                                                                                                                                                                                                   |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`       | yes      | Shown in the mood picker                                                                                                                                                                                                                                |
| `mood`       | no       | Free text used to group themes                                                                                                                                                                                                                          |
| `ui`         | yes      | Hex colors: `bg`, `panel`, `accent`, `accent2`, `text`                                                                                                                                                                                                  |
| `syntax`     | yes      | Hex colors: `keyword`, `string`, `function`, `comment`, `variable`; optional `type` (defaults to `ui.accent2`) and `number` (defaults to `ui.accent`)                                                                                                   |
| `background` | no       | See below. Defaults to a solid `ui.bg`                                                                                                                                                                                                                  |
| `glass`      | no       | `panelOpacity` from 0.2 to 1 (default 0.78), `blur` in px from 0 to 40 (default 12)                                                                                                                                                                     |
| `shape`      | no       | `radius` in px from 0 to 16 (default 8; small corners use half), `font` for the interface: `system`, `rounded`, `serif` or `mono` (default `system`)                                                                                                    |
| `mascot`     | no       | `path`, `corner` (`top-left`, `top-right`, `bottom-left`, `bottom-right`), `opacity` 0–1, `size` 32–1024 px; optional `layer` (`behind`, default, or `front` of the code) and `position` (`x` and `y` 0–1 inside the editor area, replacing the corner) |
| `effects`    | no       | Initial effects when the theme is chosen                                                                                                                                                                                                                |

### Backgrounds

| `type`           | Fields                                                                             |
| ---------------- | ---------------------------------------------------------------------------------- |
| `solid`          | `color`                                                                            |
| `gradient`       | `css`: a single `linear-`, `radial-` or `conic-gradient(...)`; `url()` is rejected |
| `image`, `video` | `path`, `fit` (`cover` or `contain`), `blur` 0–40 px, `dim` 0–1                    |

An image or video background can also say what sits behind open files, in `editor`:

```json
"editor": { "mode": "layer", "dim": 0.7, "blur": 10 }
```

| `mode`  | Behind open files                                                                                                                                                     |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layer` | Default. A layer over the wallpaper, dimmed by `dim` (0–1) and blurred by `blur` (0–40 px). With no file open, the wallpaper shows with its own `dim` and `blur` only |
| `sharp` | The window background as it is, with no extra layer                                                                                                                   |
| `solid` | The theme `ui.bg` color                                                                                                                                               |

The theme editor sets it under Background → "Behind open files". The layer uses
`backdrop-filter`, so it behaves like the glass panels.

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

Form controls get their own tokens, computed from `ui` like the save-state appearance menu does:
`--control-bg` is an opaque mix of `bg` and `panel`, and `--control-text` is the theme text when
it reaches 4.5:1 on it, otherwise black or white. `--color-scheme` (`dark` or `light`) sets the
CSS `color-scheme`, so native parts such as option lists, number spinners and scrollbars match the
theme. Selects are drawn by the app (`appearance: none`), because WebKitGTK paints a native light
field under a translucent background.

## Effects

Each effect is an attribute on `<html>`, switched independently:

| Attribute         | Values           | Behavior                                                                             |
| ----------------- | ---------------- | ------------------------------------------------------------------------------------ |
| `data-surface`    | `glass`, `solid` | Translucent panels with backdrop blur, or opaque panels (the light mode)             |
| `data-background` | `true`, `false`  | Shows or hides the background; with `solid`, it shows only behind the editor, dimmed |
| `data-mascot`     | `true`, `false`  | Shows the mascot in a corner of the editor                                           |
| `data-animations` | `true`, `false`  | Transitions and micro-animations; `prefers-reduced-motion` also turns them off       |

The mascot and the background fit are also plain CSS, so previews change them without a re-render:
`--mascot-size` and `--mascot-opacity` on `<html>`, plus the `data-mascot-corner` and
`data-backdrop-fit` attributes.

## Your own background and mascot

The mascot is locked by default: clicks pass through it. "Lock or unlock the mascot to move it"
(command palette) or the "Locked" switch in the theme editor unlocks it; then drag it anywhere
in the editor area, and double click to send it back to its corner. The lock is saved as
`mascotLocked` in the settings, and the position in your mascot. PNG, WebP and GIF mascots are
accepted; animated ones stand still on their first frame when animations are off.

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

### Theme editor

`Ctrl+K E` ("Edit current theme" in the command palette, or Edit… in the settings) opens a panel on
the right with a color picker for every `ui` and `syntax` color. The whole app previews each change
as you make it; Cancel or `Esc` brings back the theme as it was.

- Editing a built-in theme saves a new theme of yours, named `<name> copy` unless you rename it.
- Editing one of your themes saves its file in place, including a new name.
- Text and syntax colors show their contrast on the background, highlighted when below the WCAG
  AA ratio of 4.5:1 (the bar every built-in theme meets).
- A color with transparency (`#rrggbbaa`) keeps its alpha when you pick a new color.
- A switch turns the glass panels on or off (the `surface` effect; saving also keeps it in the theme's `effects`), and sliders adjust the glass (panel opacity and blur), the background (dim, blur and fit) and the
  mascot (opacity, size and corner). Background and mascot sliders change what is on screen: your
  own background or mascot when you chose one (saved in the settings, kept across themes), otherwise
  the theme's. They appear once there is an image or video background or a mascot.
- **Starting points** copy the colors, glass and shape of a built-in theme into the one you are
  editing, keeping its name and any background image, so you can start from a look and adjust it.
- **Shape** sets the corners of every panel, button and field (with Square, Soft, Default and Round
  presets) and the **interface font**: System, Rounded, Editorial (serif) or Terminal (the code
  font). These use fonts already on the system; nothing is downloaded.
- With an image or video background, the editor checks the panel text against the darkest and
  brightest parts the image could have (after its dim). When the panel opacity is too low for 4.5:1,
  it suggests the lowest opacity that passes, with a button to use it.
- **Undo changes** brings back the theme as it was when the editor opened, without closing it.
  **Defaults** applies the default theme's look (colors, glass and shape) to the one you are editing.
- Every color picker offers the last eight colors you saved in any theme (stored as `recentColors`
  in `settings.json`), shown as swatches by the system color picker.

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

### Import from VS Code

"Import VS Code theme…" (command palette, or "From VS Code…" in the settings) lists the color
themes installed in VS Code, both the built-in ones and those from your extensions. Pick one and
it is converted into a theme of yours and selected. "Import VS Code theme file…" converts any
VS Code theme `.json` file instead, for example one from VSCodium or Cursor.

The conversion keeps the editor background and text, the side bar as the panel color, the focus
color as the accent, and the closest token colors for each syntax role. It is a starting point:
open the theme editor (`Ctrl+K E`) to adjust anything that came out different from VS Code.
`.tmTheme` files are not supported. See [decision 0008](decisions/0008-vscode-themes.md).
