import { expect, test } from "@playwright/test";

test("opens a folder and expands a subfolder", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Open folder" }).click();
  await expect(page.getByRole("heading", { name: "sample-project" })).toBeVisible();

  await page.getByRole("button", { name: "src" }).click();
  await expect(page.getByRole("button", { name: "App.tsx" })).toBeVisible();
});
