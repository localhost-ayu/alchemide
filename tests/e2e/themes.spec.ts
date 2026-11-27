import { expect, test } from "@playwright/test";

test("duplicates a theme, switches to it and deletes it", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open folder" })).toBeVisible();
  await page.keyboard.press("Control+,");
  const settings = page.getByRole("dialog", { name: "Settings" });
  const select = settings.getByRole("combobox", { name: "Theme" });

  await settings.getByRole("button", { name: "Duplicate", exact: true }).click();
  await expect(select).toHaveValue("Catalisador copy");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "Catalisador copy");

  page.once("dialog", (dialog) => dialog.accept());
  await settings.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(select).toHaveValue("Catalisador");
  await expect(settings.getByRole("group", { name: "Your themes" })).toHaveCount(0);
});

test("edits colors with a live preview and saves them as a new theme", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open folder" })).toBeVisible();
  const html = page.locator("html");

  await page.keyboard.press("Control+k");
  await page.keyboard.press("e");
  const editor = page.getByRole("complementary", { name: "Theme editor" });
  await editor.getByLabel("Background").fill("#000000");
  await expect(page.getByRole("complementary", { name: "Explorer" })).toBeVisible();
  await expect(html).toHaveCSS("--color-bg", "#000000");

  await editor.getByRole("button", { name: "Save as new theme" }).click();
  await expect(editor).toBeHidden();
  await expect(html).toHaveAttribute("data-theme", "Catalisador copy");
  await expect(html).toHaveCSS("--color-bg", "#000000");
});

test("imports an installed VS Code theme from the command palette", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open folder" })).toBeVisible();

  await page.keyboard.press("Control+Shift+P");
  const commands = page.getByRole("combobox", { name: "Run a command" });
  await commands.fill("import vs code theme");
  await page.getByRole("option", { name: /^Import VS Code theme…/ }).click();

  const search = page.getByRole("combobox", { name: "Search VS Code themes" });
  await search.fill("solarized");
  await search.press("Enter");

  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "Solarized Light");
  await expect(html).toHaveCSS("--color-bg", "#FDF6E3");
});
