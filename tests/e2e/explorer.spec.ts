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
