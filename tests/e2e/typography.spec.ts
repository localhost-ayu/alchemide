import { expect, test } from "@playwright/test";

test("loads the bundled font chosen in the settings", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open folder" }).click();
  await page.getByRole("button", { name: "README.md" }).click();

  await page.keyboard.press("Control+,");
  await page.getByRole("combobox", { name: "Font", exact: true }).selectOption("JetBrains Mono");
  await page.getByRole("spinbutton", { name: "Line height", exact: true }).fill("2");
  await page.keyboard.press("Escape");

  const scroller = page.locator(".cm-scroller");
  await expect(scroller).toHaveCSS("font-family", /^"JetBrains Mono"/);
  await expect(scroller).toHaveCSS("line-height", "28px");
  await expect
    .poll(() => page.evaluate(() => document.fonts.check('16px "JetBrains Mono"')))
    .toBe(true);
});

test("Maple Mono is the default code font", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open folder" }).click();
  await page.getByRole("button", { name: "README.md" }).click();

  await expect(page.locator(".cm-scroller")).toHaveCSS("font-family", /^"Maple Mono"/);
  await expect
    .poll(() => page.evaluate(() => document.fonts.check('16px "Maple Mono"')))
    .toBe(true);
});
