import { type Translate, useT } from "../../lib/i18n";
import { type ServerStatus, useLanguageServerStore } from "../../lib/languageServerStore";
import type { LanguageId } from "../../lib/languages";

type LanguageServerBadgeProps = {
  language: LanguageId;
};

function badgeText(t: Translate, status: ServerStatus): { label: string; title: string } {
  switch (status.kind) {
    case "starting":
      return { label: "LSP…", title: t("lsp.starting") };
    case "ready":
      return { label: "LSP", title: t("lsp.running", { name: status.name }) };
    case "missing":
      return {
        label: t("lsp.missingLabel"),
        title: t("lsp.missing", { name: status.name, install: status.install }),
      };
    case "stopped":
      return { label: t("lsp.stoppedLabel"), title: t("lsp.stopped", { name: status.name }) };
    case "error":
      return { label: t("lsp.errorLabel"), title: status.message };
  }
}

export function LanguageServerBadge({ language }: LanguageServerBadgeProps) {
  const t = useT();
  const status = useLanguageServerStore((state) => state.statuses[language]);
  if (!status) {
    return null;
  }
  const { label, title } = badgeText(t, status);
  return (
    <span className="statusbar__lsp" data-status={status.kind} title={title}>
      {label}
    </span>
  );
}
