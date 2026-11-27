import { useEffect } from "react";
import { registerCommands } from "../../lib/commands";
import { useT } from "../../lib/i18n";
import {
  deleteCurrentTheme,
  duplicateCurrentTheme,
  exportCurrentTheme,
  importThemeFile,
} from "./themeLibrary";
import { reloadUserThemes } from "./useThemeStore";

export function ThemeCommands() {
  const t = useT();
  useEffect(
    () =>
      registerCommands([
        { id: "themes.reload", title: t("themes.reload"), run: () => reloadUserThemes() },
        { id: "themes.duplicate", title: t("themes.duplicateCurrent"), run: duplicateCurrentTheme },
        { id: "themes.import", title: t("themes.importFile"), run: importThemeFile },
        { id: "themes.export", title: t("themes.exportCurrent"), run: exportCurrentTheme },
        { id: "themes.delete", title: t("themes.deleteCurrent"), run: deleteCurrentTheme },
      ]),
    [t],
  );
  return null;
}
