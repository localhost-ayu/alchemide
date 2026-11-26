import { render, screen, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";
import { CodeBlock } from "./CodeBlock";

test("highlights tokens with theme variables instead of fixed colors", async () => {
  const { container } = render(<CodeBlock code={'const flask = "ready";'} language="typescript" />);

  await waitFor(() =>
    expect(container.querySelector("code")?.getAttribute("data-highlighted")).toBe("true"),
  );
  const string = screen.getByText('"ready"');
  expect(string.getAttribute("style")).toContain("var(--shiki-token-string");
  expect(container.querySelector("code")?.textContent).toBe('const flask = "ready";');
});

test("keeps every line of the code", async () => {
  const code = "SELECT id\nFROM users\nWHERE active = 1;";
  const { container } = render(<CodeBlock code={code} language="sql" />);

  await waitFor(() =>
    expect(container.querySelector("code")?.getAttribute("data-highlighted")).toBe("true"),
  );
  expect(container.querySelectorAll(".code-line")).toHaveLength(3);
  expect(container.querySelector("code")?.textContent).toBe(code);
});
