import { expect, test } from "@playwright/test";

test("duplicates a theme, switches to it and deletes it", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open folder" })).toBeVisible();
  await page.keyboard.press("Control+,");
  const settings = page.getByRole("dialog", { name: "Settings" });
  const select = settings.getByRole("combobox", { name: "Theme" });

  await settings.getByRole("button", { name: "Duplicate" }).click();
  await expect(select).toHaveValue("Catalisador copy");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "Catalisador copy");

  page.once("dialog", (dialog) => dialog.accept());
  await settings.getByRole("button", { name: "Delete" }).click();
  await expect(select).toHaveValue("Catalisador");
  await expect(settings.getByRole("group", { name: "Your themes" })).toHaveCount(0);
});
