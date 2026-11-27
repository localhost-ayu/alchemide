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

test("opens a file with quick open", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open folder" }).click();
  await expect(page.getByRole("button", { name: "README.md" })).toBeVisible();

  await page.keyboard.press("Control+p");
  const search = page.getByRole("combobox", { name: "Go to file" });
  await search.fill("apptsx");
  await search.press("Enter");

  await expect(page.getByRole("textbox", { name: "Editing App.tsx" })).toBeVisible();
});

test("finds and replaces across the project", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open folder" }).click();
  await page.getByRole("button", { name: "src" }).click();
  await page.getByRole("button", { name: "App.tsx" }).click();
  const editor = page.getByRole("textbox", { name: "Editing App.tsx" });
  await expect(editor).toContainText('"Hello"');

  await page.keyboard.press("Control+Shift+F");
  const search = page.getByRole("textbox", { name: "Search in files" });
  await expect(search).toBeFocused();
  await search.fill("Hello");
  await search.press("Enter");
  const panel = page.getByRole("complementary", { name: "Search" });
  await expect(panel.getByRole("status")).toHaveText("2 results in 2 files");

  await page.getByRole("textbox", { name: "Replace with" }).fill("Olá");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Replace" }).click();

  await expect(editor).toContainText('"Olá"');
  await page.keyboard.press("Control+Shift+E");
  await expect(page.getByRole("button", { name: "App.tsx", exact: true })).toBeVisible();
});

test("opens a single file with Ctrl+O and a folder with Ctrl+K Ctrl+O", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open folder" })).toBeVisible();

  await page.keyboard.press("Control+o");
  await expect(page.getByRole("textbox", { name: "Editing todo.md" })).toContainText(
    "Water the plants",
  );

  await page.keyboard.press("Control+k");
  await page.keyboard.press("Control+o");
  await expect(page.getByRole("heading", { name: "sample-project" })).toBeVisible();
});

test("shows who last changed the cursor line and can be turned off", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open folder" }).click();
  await page.getByRole("button", { name: "README.md" }).click();
  const editor = page.getByRole("textbox", { name: "Editing README.md" });
  const blame = page.locator(".cm-inline-blame");

  await editor.click();
  await page.keyboard.press("Control+Home");
  await expect(blame).toHaveText("You, uncommitted");
  await page.keyboard.press("ArrowDown");
  await expect(blame).toHaveText("Sample Author, 10 months ago");
  await expect(blame).toHaveAttribute("title", "4f1c2a9 feat: first sample commit");

  await page.keyboard.type("x");
  await expect(blame).toHaveCount(0);
  await page.keyboard.press("Control+s");
  await expect(blame).toHaveCount(1);

  await page.keyboard.press("Control+,");
  await page
    .getByRole("dialog", { name: "Settings" })
    .getByRole("checkbox", { name: /git blame/ })
    .uncheck();
  await expect(blame).toHaveCount(0);
});

test("opens the Markdown preview from the button on the tab bar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open folder" }).click();
  await page.getByRole("button", { name: "README.md" }).click();

  const toggle = page.getByRole("button", { name: "Toggle Markdown preview" });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.getByRole("region", { name: "Markdown preview" })).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
});

test("creates a new file from the explorer and saves it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open folder" }).click();
  await page.getByRole("button", { name: "src", exact: true }).click();

  await page.keyboard.press("Control+n");
  await page.getByRole("textbox", { name: "New file name" }).fill("hello.ts");
  await page.keyboard.press("Enter");

  await expect(page.getByRole("button", { name: "hello.ts", exact: true })).toBeVisible();
  const editor = page.getByRole("textbox", { name: "Editing hello.ts" });
  await editor.click();
  await page.keyboard.type("export const hi = 1;");
  await page.keyboard.press("Control+s");
  await expect(page.getByRole("tab", { name: /hello\.ts/ })).not.toContainText("●");
});
