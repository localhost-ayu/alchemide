import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { useLanguageServerStore } from "../../lib/languageServerStore";
import { LanguageServerBadge } from "./LanguageServerBadge";

beforeEach(() => {
  useLanguageServerStore.setState({ statuses: {} });
});

test("shows nothing for languages without a language server", () => {
  const { container } = render(<LanguageServerBadge language="markdown" />);

  expect(container.textContent).toBe("");
});

test("names the running server in the tooltip", () => {
  useLanguageServerStore
    .getState()
    .setStatus("tsx", { kind: "ready", name: "TypeScript language server" });

  render(<LanguageServerBadge language="tsx" />);

  expect(screen.getByText("LSP").title).toBe("TypeScript language server is running");
});

test("tells how to install a missing server", () => {
  useLanguageServerStore.getState().setStatus("php", {
    kind: "missing",
    name: "Intelephense",
    install: "npm install -g intelephense",
  });

  render(<LanguageServerBadge language="php" />);

  expect(screen.getByText("No LSP").title).toBe(
    "Intelephense is not installed. Install it with: npm install -g intelephense",
  );
});

test("points to the restart command when the server stops", () => {
  useLanguageServerStore.getState().setStatus("sql", { kind: "stopped", name: "sqls" });

  render(<LanguageServerBadge language="sql" />);

  expect(screen.getByText("LSP stopped").title).toContain("Restart language servers");
});
