import { useEffect } from "react";
import { useActivityStore } from "../../lib/activityStore";
import { registerCommands } from "../../lib/commands";
import { useSnippetStore } from "../../lib/snippetStore";
import { importMessage } from "./importMessage";

export function SnippetCommands() {
  useEffect(
    () =>
      registerCommands([
        {
          id: "snippets.importVscode",
          title: "Import snippets from VS Code",
          run: async () => {
            const result = await useSnippetStore.getState().importFromVscode();
            useActivityStore.getState().notify(importMessage(result));
          },
        },
        {
          id: "snippets.reload",
          title: "Reload snippets",
          run: async () => {
            await useSnippetStore.getState().load();
            useActivityStore.getState().notify("Snippets reloaded");
          },
        },
      ]),
    [],
  );
  return null;
}
