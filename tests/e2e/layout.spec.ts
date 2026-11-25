import { expect, test } from "@playwright/test";

test("shows the explorer, the editor and the status bar", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("complementary", { name: "Explorer" })).toBeVisible();
  await expect(page.getByRole("main", { name: "Editor" })).toBeVisible();
  await expect(page.getByRole("contentinfo")).toContainText("Linux");
});

test("opens a folder from the explorer", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Open folder" }).click();

  await expect(page.getByRole("heading", { name: "sample-project" })).toBeVisible();
});
