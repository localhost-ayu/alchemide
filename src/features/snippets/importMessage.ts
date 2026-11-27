import { t } from "../../lib/i18n";
import type { SnippetImport } from "../../lib/types";

export function importMessage(result: SnippetImport): string {
  if (!result.found) {
    return t("snippets.noVscodeFolder");
  }
  if (result.copied === 0) {
    return t("snippets.alreadyImported");
  }
  return result.copied === 1
    ? t("snippets.importedOne")
    : t("snippets.importedMany", { count: result.copied });
}
