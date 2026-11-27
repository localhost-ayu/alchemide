import { useEffect } from "react";
import { useActivityStore } from "../../lib/activityStore";
import { registerCommands } from "../../lib/commands";
import { useT } from "../../lib/i18n";
import { useSnippetStore } from "../../lib/snippetStore";
import { importMessage } from "./importMessage";

export function SnippetCommands() {
  const t = useT();
  useEffect(
    () =>
      registerCommands([
        {
          id: "snippets.importVscode",
          title: t("snippets.importVscode"),
          run: async () => {
            const result = await useSnippetStore.getState().importFromVscode();
            useActivityStore.getState().notify(importMessage(result));
          },
        },
        {
          id: "snippets.reload",
          title: t("snippets.reload"),
          run: async () => {
            await useSnippetStore.getState().load();
            useActivityStore.getState().notify(t("snippets.reloaded"));
          },
        },
      ]),
    [t],
  );
  return null;
}
