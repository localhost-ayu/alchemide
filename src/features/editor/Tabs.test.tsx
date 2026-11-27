import { render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { type Tab, useEditorStore } from "../../lib/editorStore";
import { Tabs } from "./Tabs";

function tab(path: string): Tab {
  return {
    path,
    name: path.split("/").pop() ?? path,
    language: "php",
    text: "",
    hasBom: false,
    lineEnding: "LF",
    dirty: false,
    revision: 0,
  };
}

afterEach(() => useEditorStore.setState({ tabs: [], activePath: null }));

test("tabs with the same file name show the folder that tells them apart", () => {
  useEditorStore.setState({
    tabs: [tab("/portal/conexao.php"), tab("/portal/beer/conexao.php"), tab("/portal/index.php")],
    activePath: "/portal/conexao.php",
  });
  render(<Tabs />);

  const labels = screen.getAllByRole("tab").map((element) => element.textContent);
  expect(labels).toEqual(["conexao.phpportal", "conexao.phpbeer", "index.php"]);
  expect(screen.getByRole("button", { name: "Close conexao.php (beer)" })).toBeTruthy();
});
