import { t } from "../../lib/i18n";

export function saveMessage(fileName: string, experiment: number, playful: boolean): string {
  return playful
    ? t("editor.experimentSaved", { number: experiment, name: fileName })
    : t("editor.saved", { name: fileName });
}
