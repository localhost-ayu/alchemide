import { expect, test } from "@playwright/test";

test("shows the explorer, the editor and the status bar", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("complementary", { name: "Explorer" })).toBeVisible();
  await expect(page.getByRole("main", { name: "Editor" })).toBeVisible();
  await expect(page.getByRole("contentinfo")).toContainText("Linux");
});

test("collapses the explorer with Ctrl+B", async ({ page }) => {
  await page.goto("/");
  const explorer = page.getByRole("complementary", { name: "Explorer" });
  await expect(explorer).toBeVisible();

  await page.keyboard.press("Control+b");
  await expect(explorer).toBeHidden();

  await page.keyboard.press("Control+b");
  await expect(explorer).toBeVisible();
});

test("applies the default theme and its effects", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");

  await expect(html).toHaveAttribute("data-theme", "Catalisador");
  await expect(html).toHaveAttribute("data-surface", "glass");
  await expect(page.getByRole("complementary", { name: "Explorer" })).toHaveCSS(
    "backdrop-filter",
    "blur(12px)",
  );
});
