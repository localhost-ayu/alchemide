import type { SnippetImport } from "../../lib/types";

export function importMessage(result: SnippetImport): string {
  if (!result.found) {
    return "No VS Code snippets folder found";
  }
  if (result.copied === 0) {
    return "VS Code snippets are already imported";
  }
  return result.copied === 1
    ? "Imported 1 snippet file from VS Code"
    : `Imported ${result.copied} snippet files from VS Code`;
}
