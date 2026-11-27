# Layout

The window has an activity bar on the left, a side bar next to it, the editor with the terminal
below it, and a status bar at the bottom. Everything except the editor can be hidden.

| Part          | How to show or hide it                                                                    | Saved |
| ------------- | ----------------------------------------------------------------------------------------- | ----- |
| Side bar      | `Ctrl+B`; clicking the open view in the activity bar collapses it                         | yes   |
| Side bar view | Activity bar, `Ctrl+Shift+E` (Explorer), `Ctrl+Shift+F` (Search), `Ctrl+Shift+D` (Docker) | yes   |
| Activity bar  | "Toggle activity bar" in the command palette, or Settings → Layout                        | yes   |
| Status bar    | "Toggle status bar", or Settings → Layout                                                 | yes   |
| Editor tabs   | "Toggle editor tabs", or Settings → Layout                                                | yes   |
| Terminal      | ``Ctrl+` ``                                                                               | no    |
| Zen mode      | `Ctrl+K Z`: hides the activity bar, side bar, status bar and tabs at once                 | no    |

The saved choices live under `layout` in `settings.json`:

```json
{
  "layout": {
    "sidebar": "explorer",
    "sidebarOpen": true,
    "activityBar": true,
    "statusBar": true,
    "tabs": true
  }
}
```

Zen mode is not saved, so the app always opens with your normal layout. Opening a side bar view
while in zen mode leaves it. See [decision 0010](decisions/0010-layout.md).
