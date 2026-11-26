import { expect, test } from "@playwright/test";

test("opens a folder and expands a subfolder", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Open folder" }).click();
  await expect(page.getByRole("heading", { name: "sample-project" })).toBeVisible();

  await page.getByRole("button", { name: "src" }).click();
  await expect(page.getByRole("button", { name: "App.tsx" })).toBeVisible();
});

test("opens a file in the editor with syntax highlighting", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open folder" }).click();
  await page.getByRole("button", { name: "src" }).click();

  await page.getByRole("button", { name: "App.tsx" }).click();

  const editor = page.getByRole("textbox", { name: "Editing App.tsx" });
  await expect(editor).toContainText('const greeting = "Hello";');
  await expect(editor.locator("span", { hasText: '"Hello"' })).toHaveCSS(
    "color",
    "rgb(182, 242, 74)",
  );
});

test("edits and saves a file", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open folder" }).click();
  await page.getByRole("button", { name: "README.md" }).click();

  const editor = page.getByRole("textbox", { name: "Editing README.md" });
  await editor.click();
  await page.keyboard.press("Control+End");
  await page.keyboard.type("Edited in the browser.");
  await expect(page.getByRole("img", { name: "unsaved" })).toBeVisible();

  await page.keyboard.press("Control+s");
  await expect(page.getByRole("img", { name: "unsaved" })).toBeHidden();
  await expect(page.getByRole("status")).toHaveText("Experiment #1 saved: README.md");

  await page.getByRole("button", { name: "Close README.md" }).click();
  await page.getByRole("button", { name: "README.md" }).click();
  await expect(page.getByRole("textbox", { name: "Editing README.md" })).toContainText(
    "Edited in the browser.",
  );
});

test("describes the open file in the status bar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open folder" }).click();
  await page.getByRole("button", { name: "query.sql" }).click();

  const statusBar = page.getByRole("contentinfo");
  await expect(statusBar).toContainText("Ln 1, Col 1");
  await expect(statusBar).toContainText("4 lines");
  await expect(statusBar).toContainText("SQL");

  await page.getByRole("textbox", { name: "Editing query.sql" }).click();
  await page.keyboard.press("Control+End");
  await expect(statusBar).toContainText("Ln 4, Col 1");
});

test("previews Markdown side by side and follows edits", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open folder" }).click();
  await page.getByRole("button", { name: "README.md" }).click();
  const editor = page.getByRole("textbox", { name: "Editing README.md" });
  await editor.click();

  await page.keyboard.press("Control+Shift+V");
  const preview = page.getByRole("region", { name: "Markdown preview" });
  await expect(preview.getByRole("heading", { name: "Sample project" })).toBeVisible();
  await expect(preview.getByRole("table")).toBeVisible();
  const string = preview.locator("code[data-highlighted]").getByText('"ready"', { exact: true });
  await expect(string).toHaveCSS("color", "rgb(182, 242, 74)");

  await page.keyboard.press("Control+Home");
  await page.keyboard.type("# Lab notes\n\n");
  await expect(preview.getByRole("heading", { name: "Lab notes" })).toBeVisible();
});
