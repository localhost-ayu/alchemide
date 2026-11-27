import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { registerCommands } from "../../lib/commands";
import { useEditorStore } from "../../lib/editorStore";
import { StatusBar } from "./StatusBar";

beforeEach(() => {
  useEditorStore.setState({
    tabs: [],
    activePath: null,
    cursor: null,
    drafts: {},
    scroll: 0,
    reveal: null,
    error: null,
  });
});

test("shows only the environment while no file is open", async () => {
  render(<StatusBar />);

  expect(await screen.findByText("Linux")).toBeTruthy();
  expect(screen.queryByText(/^Ln /)).toBeNull();
});

test("describes the active file and the cursor", async () => {
  useEditorStore.setState({
    tabs: [
      {
        path: "/p/legacy.php",
        name: "legacy.php",
        language: "php",
        text: "",
        hasBom: true,
        lineEnding: "CRLF",
        dirty: false,
        revision: 0,
      },
    ],
    activePath: "/p/legacy.php",
    cursor: { line: 3, column: 7, lineCount: 120 },
  });

  render(<StatusBar />);

  for (const text of ["Ln 3, Col 7", "120 lines", "UTF-8 with BOM", "CRLF", "PHP"]) {
    expect(screen.getByText(text)).toBeTruthy();
  }
  expect(await screen.findByText("Linux")).toBeTruthy();
});

test("the terminal button runs the terminal command", () => {
  const run = vi.fn();
  const unregister = registerCommands([{ id: "terminal.toggle", title: "Toggle terminal", run }]);
  render(<StatusBar />);

  fireEvent.click(screen.getByRole("button", { name: "Toggle terminal" }));

  expect(run).toHaveBeenCalledOnce();
  unregister();
});
