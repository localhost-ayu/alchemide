import { useEffect } from "react";
import { registerCommands } from "../../lib/commands";
import {
  deleteCurrentTheme,
  duplicateCurrentTheme,
  exportCurrentTheme,
  importThemeFile,
} from "./themeLibrary";
import { reloadUserThemes } from "./useThemeStore";

export function ThemeCommands() {
  useEffect(
    () =>
      registerCommands([
        { id: "themes.reload", title: "Reload your themes", run: () => reloadUserThemes() },
        { id: "themes.duplicate", title: "Duplicate current theme", run: duplicateCurrentTheme },
        { id: "themes.import", title: "Import theme…", run: importThemeFile },
        { id: "themes.export", title: "Export current theme…", run: exportCurrentTheme },
        { id: "themes.delete", title: "Delete current theme", run: deleteCurrentTheme },
      ]),
    [],
  );
  return null;
}
