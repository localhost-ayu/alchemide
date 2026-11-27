import { expect, type Page, test } from "@playwright/test";

async function openPhpFile(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Open folder" }).click();
  await page.getByRole("button", { name: "index.php" }).click();
  const editor = page.getByRole("textbox", { name: "Editing index.php" });
  await editor.click();
  await page.keyboard.press("Control+End");
  return editor;
}

function completion(page: Page, label: string) {
  return page
    .locator(".cm-tooltip-autocomplete li")
    .filter({ has: page.locator(".cm-completionLabel", { hasText: new RegExp(`^${label}$`) }) });
}

test("expands a built-in snippet and moves between its fields", async ({ page }) => {
  const editor = await openPhpFile(page);
  await page.keyboard.type("foreach");

  await completion(page, "foreach").click();
  await page.keyboard.type("users");
  await page.keyboard.press("Tab");
  await page.keyboard.type("user");

  await expect(editor).toContainText("foreach ($users as $user) {");
});

test("imports snippets from VS Code and offers them", async ({ page }) => {
  const editor = await openPhpFile(page);

  await page.keyboard.press("Control+Shift+P");
  const search = page.getByRole("combobox", { name: "Run a command" });
  await search.fill("import snippets");
  await search.press("Enter");
  await expect(
    page.getByRole("status").filter({ hasText: "Imported 1 snippet file" }),
  ).toBeVisible();

  await editor.click();
  await page.keyboard.press("Control+End");
  await page.keyboard.type("hello");
  await completion(page, "hello").click();

  await expect(editor).toContainText('echo "Hello from VS Code";');
});

test("framework packs are turned on in the settings", async ({ page }) => {
  const editor = await openPhpFile(page);
  await page.keyboard.type("lr-dd");
  await expect(completion(page, "lr-dd")).toHaveCount(0);
  await page.keyboard.press("Escape");

  await page.keyboard.press("Control+,");
  await page.getByRole("checkbox", { name: /Laravel/ }).check();
  await page.keyboard.press("Escape");

  await editor.click();
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Backspace");
  await page.keyboard.type("d");
  await completion(page, "lr-dd").click();

  await expect(editor).toContainText("dd($var);");
});
