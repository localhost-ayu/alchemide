import { afterEach, expect, test } from "vitest";
import { setMockLanguageServers, stopMockLanguageServer } from "../../lib/ipc.mock";
import { useLanguageServerStore } from "../../lib/languageServerStore";
import { languageServerExtension, lspLanguageId, stopLanguageServers } from "./languageServers";

const root = "/home/user/sample-project";

afterEach(async () => {
  await stopLanguageServers();
  setMockLanguageServers(["typescript"]);
});

function statusOf(language: Parameters<typeof lspLanguageId>[0]) {
  return useLanguageServerStore.getState().statuses[language];
}

test("maps editor languages to LSP language ids", () => {
  expect(lspLanguageId("tsx")).toBe("typescriptreact");
  expect(lspLanguageId("jsx")).toBe("javascriptreact");
  expect(lspLanguageId("php")).toBe("php");
  expect(lspLanguageId("markdown")).toBeNull();
});

test("ignores languages without a language server", async () => {
  expect(await languageServerExtension(`${root}/README.md`, "markdown")).toBeNull();
  expect(statusOf("markdown")).toBeUndefined();
});

test("connects a file to its language server", async () => {
  const extension = await languageServerExtension(`${root}/src/App.tsx`, "tsx");

  expect(extension).not.toBeNull();
  expect(statusOf("tsx")).toEqual({ kind: "ready", name: "TypeScript language server" });
});

test("reports a missing language server with its install command", async () => {
  setMockLanguageServers([]);

  expect(await languageServerExtension(`${root}/legacy.php`, "php")).toBeNull();
  expect(statusOf("php")).toEqual({
    kind: "missing",
    name: "Intelephense",
    install: "npm install -g intelephense",
  });
});

test("marks every language of a server as stopped when it exits", async () => {
  await languageServerExtension(`${root}/src/App.tsx`, "tsx");
  await languageServerExtension(`${root}/src/main.ts`, "typescript");

  stopMockLanguageServer(1);

  expect(statusOf("tsx")).toEqual({ kind: "stopped", name: "TypeScript language server" });
  expect(statusOf("typescript")).toEqual({ kind: "stopped", name: "TypeScript language server" });
});

test("restarting clears the statuses and bumps the generation", async () => {
  await languageServerExtension(`${root}/src/App.tsx`, "tsx");
  const { generation } = useLanguageServerStore.getState();

  await stopLanguageServers();

  expect(useLanguageServerStore.getState().statuses).toEqual({});
  expect(useLanguageServerStore.getState().generation).toBe(generation + 1);
  expect(await languageServerExtension(`${root}/src/App.tsx`, "tsx")).not.toBeNull();
});
