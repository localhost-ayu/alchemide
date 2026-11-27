import { LSPClient, languageServerExtensions, type Transport } from "@codemirror/lsp-client";
import type { Extension } from "@codemirror/state";
import { fileUri } from "../../lib/fileUri";
import { lspSend, lspStart, lspStop, onLspExit, onLspMessage } from "../../lib/ipc";
import { useLanguageServerStore } from "../../lib/languageServerStore";
import type { LanguageId } from "../../lib/languages";
import { EditorWorkspace } from "./editorWorkspace";

type Connection = {
  id: number;
  name: string;
  client: LSPClient;
  languages: Set<LanguageId>;
};

const LSP_LANGUAGE_IDS: Partial<Record<LanguageId, string>> = {
  php: "php",
  javascript: "javascript",
  typescript: "typescript",
  jsx: "javascriptreact",
  tsx: "typescriptreact",
  sql: "sql",
};

const listeners = new Map<number, Set<(message: string) => void>>();
const connections = new Map<number, Connection>();
const starting = new Map<LanguageId, Promise<Connection | null>>();
let listening: Promise<unknown> | null = null;

export function lspLanguageId(language: LanguageId): string | null {
  return LSP_LANGUAGE_IDS[language] ?? null;
}

function handleExit(id: number): void {
  const connection = connections.get(id);
  if (!connection) {
    return;
  }
  connections.delete(id);
  listeners.delete(id);
  for (const language of connection.languages) {
    starting.delete(language);
    useLanguageServerStore
      .getState()
      .setStatus(language, { kind: "stopped", name: connection.name });
  }
  connection.client.disconnect();
}

function listen(): Promise<unknown> {
  listening ??= Promise.all([
    onLspMessage(({ id, message }) => {
      for (const handler of listeners.get(id) ?? []) {
        handler(message);
      }
    }),
    onLspExit(handleExit),
  ]);
  return listening;
}

function transport(id: number): Transport {
  const handlers = new Set<(message: string) => void>();
  listeners.set(id, handlers);
  return {
    send: (message) => {
      lspSend(id, message).catch(() => handleExit(id));
    },
    subscribe: (handler) => handlers.add(handler),
    unsubscribe: (handler) => handlers.delete(handler),
  };
}

async function connect(language: LanguageId): Promise<Connection | null> {
  const { setStatus } = useLanguageServerStore.getState();
  setStatus(language, { kind: "starting" });
  await listen();
  const start = await lspStart(language);
  if (start.kind === "unsupported") {
    setStatus(language, null);
    return null;
  }
  if (start.kind === "missing") {
    setStatus(language, start);
    return null;
  }
  let connection = connections.get(start.id);
  if (!connection) {
    const client = new LSPClient({
      rootUri: fileUri(start.root),
      extensions: languageServerExtensions(),
      workspace: (client) => {
        const workspace = new EditorWorkspace(client);
        workspace.root = start.root;
        return workspace;
      },
    }).connect(transport(start.id));
    connection = { id: start.id, name: start.name, client, languages: new Set() };
    connections.set(start.id, connection);
  }
  connection.languages.add(language);
  setStatus(language, { kind: "ready", name: start.name });
  return connection;
}

export async function languageServerExtension(
  path: string,
  language: LanguageId,
): Promise<Extension | null> {
  const languageId = lspLanguageId(language);
  if (!languageId) {
    return null;
  }
  let pending = starting.get(language);
  if (!pending) {
    pending = connect(language).catch((error: unknown) => {
      starting.delete(language);
      useLanguageServerStore
        .getState()
        .setStatus(language, { kind: "error", message: String(error) });
      return null;
    });
    starting.set(language, pending);
  }
  const connection = await pending;
  return connection ? connection.client.plugin(fileUri(path), languageId) : null;
}

export async function stopLanguageServers(): Promise<void> {
  const running = [...connections.values()];
  connections.clear();
  starting.clear();
  listeners.clear();
  for (const { id, client } of running) {
    client.disconnect();
    await lspStop(id).catch(() => {});
  }
  useLanguageServerStore.getState().restarted();
}
