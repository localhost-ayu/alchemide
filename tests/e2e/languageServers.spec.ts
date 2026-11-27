import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open folder" }).click();
  await page.getByRole("button", { name: "src" }).click();
  await page.getByRole("button", { name: "App.tsx" }).click();
});

test("shows that the language server is running", async ({ page }) => {
  await expect(page.getByRole("contentinfo").getByText("LSP", { exact: true })).toHaveAttribute(
    "title",
    "TypeScript language server is running",
  );
});

test("completes with suggestions from the language server", async ({ page }) => {
  const editor = page.getByRole("textbox", { name: "Editing App.tsx" });
  await editor.click();
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("fla");
  await page.keyboard.press("Control+Space");

  await page.getByRole("option", { name: /flaskReady/ }).click();
  await expect(editor).toContainText("flaskReady");
});

test("underlines the problems the language server reports", async ({ page }) => {
  const editor = page.getByRole("textbox", { name: "Editing App.tsx" });
  await editor.click();
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("debugger;");

  await expect(editor.locator(".cm-lintRange-error")).toHaveText("debugger");
});

test("jumps to a definition in another file with F12", async ({ page }) => {
  const editor = page.getByRole("textbox", { name: "Editing App.tsx" });
  await editor.click();
  await page.keyboard.press("F12");

  await expect(page.getByRole("textbox", { name: "Editing main.ts" })).toBeVisible();
  await expect(page.getByRole("contentinfo")).toContainText("Ln 3, Col 9");
});
