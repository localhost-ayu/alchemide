import { type ServerStatus, useLanguageServerStore } from "../../lib/languageServerStore";
import type { LanguageId } from "../../lib/languages";

type LanguageServerBadgeProps = {
  language: LanguageId;
};

function badgeText(status: ServerStatus): { label: string; title: string } {
  switch (status.kind) {
    case "starting":
      return { label: "LSP…", title: "Starting the language server" };
    case "ready":
      return { label: "LSP", title: `${status.name} is running` };
    case "missing":
      return {
        label: "No LSP",
        title: `${status.name} is not installed. Install it with: ${status.install}`,
      };
    case "stopped":
      return {
        label: "LSP stopped",
        title: `${status.name} stopped. Run "Restart language servers" to start it again`,
      };
    case "error":
      return { label: "LSP error", title: status.message };
  }
}

export function LanguageServerBadge({ language }: LanguageServerBadgeProps) {
  const status = useLanguageServerStore((state) => state.statuses[language]);
  if (!status) {
    return null;
  }
  const { label, title } = badgeText(status);
  return (
    <span className="statusbar__lsp" data-status={status.kind} title={title}>
      {label}
    </span>
  );
}
