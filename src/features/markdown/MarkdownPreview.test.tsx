import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { mockOpenedLinks } from "../../lib/ipc.mock";
import { MarkdownPreview } from "./MarkdownPreview";

test("never renders raw HTML or scripts", () => {
  const { container } = render(
    <MarkdownPreview
      source={'<script>window.hacked = true</script>\n\n<img src="x" onerror="alert(1)">\n\nText'}
    />,
  );

  expect(container.querySelector("script")).toBeNull();
  expect(container.querySelector("[onerror]")).toBeNull();
  expect(screen.getByText("Text")).toBeTruthy();
});

test("drops javascript: links", () => {
  render(<MarkdownPreview source="[click](javascript:alert(1))" />);

  expect(screen.getByText("click").closest("a")?.getAttribute("href") ?? "").not.toContain(
    "javascript",
  );
});

test("opens external links in the system browser", () => {
  render(<MarkdownPreview source="[Releases](https://github.com/localhost-ayu/alchemide)" />);

  const link = screen.getByRole("link", { name: "Releases" });
  const event = fireEvent.click(link);

  expect(event).toBe(false);
  expect(mockOpenedLinks()).toContain("https://github.com/localhost-ayu/alchemide");
});

test("loads remote images only after permission", () => {
  const { container } = render(
    <MarkdownPreview source="![screenshot](https://example.com/shot.png)" />,
  );
  expect(container.querySelector("img")).toBeNull();

  fireEvent.click(
    screen.getByRole("button", { name: /Load remote image “screenshot” from example.com/ }),
  );

  expect(container.querySelector("img")?.getAttribute("src")).toBe("https://example.com/shot.png");
});

test("shows local images as a placeholder", () => {
  render(<MarkdownPreview source="![diagram](docs/diagram.png)" />);

  expect(screen.getByText("[diagram]")).toBeTruthy();
});
