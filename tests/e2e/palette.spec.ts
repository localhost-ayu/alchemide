import { expect, type Page, test } from "@playwright/test";

async function walkToLastOption(page: Page, listName: string) {
  const options = page.getByRole("listbox").getByRole("option");
  await expect(options.first()).toBeVisible();
  const count = await options.count();
  for (let step = 1; step < count; step++) {
    await page.keyboard.press("ArrowDown");
  }
  const last = options.last();
  await expect(last, `${listName}: the last option is highlighted`).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(last, `${listName}: the highlighted option is visible`).toBeInViewport();
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 480 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open folder" }).click();
  await expect(page.getByRole("button", { name: "README.md" })).toBeVisible();
});

test("the command palette scrolls to the highlighted command", async ({ page }) => {
  await page.keyboard.press("Control+Shift+P");
  await walkToLastOption(page, "command palette");
});

test("the mood picker scrolls to the highlighted option", async ({ page }) => {
  await page.keyboard.press("Control+k");
  await page.keyboard.press("m");
  await walkToLastOption(page, "mood picker");
});
