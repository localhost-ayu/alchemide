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

test("solid surface removes the glass blur without reloading", async ({ page }) => {
  await page.goto("/");
  const explorer = page.getByRole("complementary", { name: "Explorer" });
  await expect(explorer).toHaveCSS("backdrop-filter", "blur(12px)");

  await page.evaluate(() => {
    document.documentElement.dataset.surface = "solid";
  });

  await expect(explorer).toHaveCSS("backdrop-filter", "none");
});

test("switches theme and turns the glass off from the mood picker", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  const explorer = page.getByRole("complementary", { name: "Explorer" });
  await expect(explorer).toBeVisible();

  await page.keyboard.press("Control+k");
  await page.keyboard.press("m");
  const search = page.getByRole("combobox", { name: "Search themes and effects" });
  await search.fill("menta");
  await search.press("Enter");
  await expect(html).toHaveAttribute("data-theme", "Menta");

  await page.keyboard.press("Control+k");
  await page.keyboard.press("m");
  await search.fill("focado");
  await search.press("Enter");
  await expect(html).toHaveAttribute("data-surface", "solid");
  await expect(html).toHaveAttribute("data-theme", "Menta");
  await expect(explorer).toHaveCSS("backdrop-filter", "none");
});

test("picks a mascot and toggles it with Ctrl+Alt+M", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("complementary", { name: "Explorer" })).toBeVisible();

  await page.keyboard.press("Control+k");
  await page.keyboard.press("m");
  const search = page.getByRole("combobox", { name: "Search themes and effects" });
  await search.fill("choose mascot");
  await search.press("Enter");

  const mascot = page.locator(".mascot");
  await expect(mascot).toBeVisible();
  await page.keyboard.press("Control+Alt+m");
  await expect(mascot).toBeHidden();
  await page.keyboard.press("Control+Alt+m");
  await expect(mascot).toBeVisible();
});

test("runs a command in the terminal panel", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("complementary", { name: "Explorer" })).toBeVisible();

  await page.keyboard.press("Control+Backquote");
  const panel = page.getByRole("region", { name: "Terminal" });
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Mock shell");

  await panel.locator(".xterm").click();
  await page.keyboard.type("git status");
  await page.keyboard.press("Enter");
  await expect(panel).toContainText("ran: git status");

  await page.keyboard.press("Control+Backquote");
  await expect(panel).toBeHidden();
});

test("the terminal follows the theme", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("complementary", { name: "Explorer" })).toBeVisible();
  await page.keyboard.press("Control+Backquote");
  const panel = page.getByRole("region", { name: "Terminal" });
  await expect(panel).toContainText("Mock shell");
  const promptColor = () =>
    panel
      .locator(".xterm-rows span", { hasText: "lab" })
      .first()
      .evaluate((node) => getComputedStyle(node).color);
  const before = await promptColor();

  await page.keyboard.press("Control+k");
  await page.keyboard.press("m");
  const search = page.getByRole("combobox", { name: "Search themes and effects" });
  await search.fill("lavanda");
  await search.press("Enter");

  await expect.poll(promptColor).not.toBe(before);
});

test("runs actions from the command palette", async ({ page }) => {
  await page.goto("/");
  const explorer = page.getByRole("complementary", { name: "Explorer" });
  await expect(explorer).toBeVisible();

  await page.keyboard.press("Control+Shift+P");
  const search = page.getByRole("combobox", { name: "Run a command" });
  await expect(page.getByRole("option", { name: /Toggle terminal/ })).toBeVisible();
  await search.fill("toggle side bar");
  await search.press("Enter");

  await expect(explorer).toBeHidden();
});

test("changes theme and effects from the settings screen", async ({ page }) => {
  await page.goto("/");
  const explorer = page.getByRole("complementary", { name: "Explorer" });
  await expect(explorer).toBeVisible();

  await page.keyboard.press("Control+,");
  const settings = page.getByRole("dialog", { name: "Settings" });
  await settings.getByRole("combobox", { name: "Theme" }).selectOption("Aço");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "Aço");
  await page.keyboard.press("Escape");

  await page.keyboard.press("Control+k");
  await page.keyboard.press("e");
  const editor = page.getByRole("complementary", { name: "Theme editor" });
  await editor.getByRole("checkbox", { name: "Glass panels" }).uncheck();
  await expect(explorer).toHaveCSS("backdrop-filter", "none");
  await editor.getByRole("button", { name: "Save as new theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-surface", "solid");
});

test("switches side bar views from the activity bar and hides bars", async ({ page }) => {
  await page.goto("/");
  const activity = page.getByRole("navigation", { name: "Activity bar" });
  await expect(page.getByRole("complementary", { name: "Explorer" })).toBeVisible();

  await activity.getByRole("button", { name: "Docker" }).click();
  await expect(page.getByRole("complementary", { name: "Docker" })).toBeVisible();
  await activity.getByRole("button", { name: "Docker" }).click();
  await expect(page.getByRole("complementary")).toHaveCount(0);

  await page.keyboard.press("Control+,");
  const settings = page.getByRole("dialog", { name: "Settings" });
  await settings.getByRole("checkbox", { name: "Status bar" }).uncheck();
  await settings.getByRole("checkbox", { name: "Activity bar" }).uncheck();
  await page.keyboard.press("Escape");
  await expect(page.locator(".app__statusbar")).toBeHidden();
  await expect(activity).toBeHidden();
});

test("zen mode hides everything but the editor and comes back", async ({ page }) => {
  await page.goto("/");
  const activity = page.getByRole("navigation", { name: "Activity bar" });
  const explorer = page.getByRole("complementary", { name: "Explorer" });
  await expect(explorer).toBeVisible();

  await page.keyboard.press("Control+k");
  await page.keyboard.press("z");
  await expect(explorer).toBeHidden();
  await expect(activity).toBeHidden();
  await expect(page.locator(".app__statusbar")).toBeHidden();

  await page.keyboard.press("Control+k");
  await page.keyboard.press("z");
  await expect(explorer).toBeVisible();
  await expect(activity).toBeVisible();
});

test("select fields stay readable in light and dark themes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("complementary").first()).toBeVisible();

  for (const theme of ["Catalisador", "Pêssego"]) {
    await page.keyboard.press("Control+,");
    const settings = page.getByRole("dialog", { name: "Settings" });
    const select = settings.getByRole("combobox", { name: "Theme" });
    await select.selectOption(theme);
    const style = await select.evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        appearance: computed.appearance,
        background: computed.backgroundColor,
        color: computed.color,
        scheme: getComputedStyle(document.documentElement).colorScheme,
      };
    });
    expect(style.appearance).toBe("none");
    expect(style.background).toMatch(/^rgb\(/);
    expect(style.background).not.toBe(style.color);
    expect(style.scheme).toBe(theme === "Pêssego" ? "light" : "dark");
    await page.keyboard.press("Escape");
  }
});

test("resizes the sidebar and the terminal by dragging their edges", async ({ page }) => {
  await page.goto("/");
  const sidebar = page.getByRole("complementary", { name: "Explorer" });
  await expect(sidebar).toBeVisible();
  const before = (await sidebar.boundingBox())?.width ?? 0;

  const sidebarHandle = page.getByRole("separator", { name: "Resize sidebar" });
  const box = await sidebarHandle.boundingBox();
  if (!box) throw new Error("no sidebar handle");
  await page.mouse.move(box.x + box.width / 2, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + 100, { steps: 5 });
  await page.mouse.up();
  await expect
    .poll(async () => (await sidebar.boundingBox())?.width ?? 0)
    .toBeGreaterThan(before + 80);

  await page.keyboard.press("Control+Backquote");
  const terminal = page.getByRole("region", { name: "Terminal" });
  await expect(terminal).toBeVisible();
  const height = (await terminal.boundingBox())?.height ?? 0;
  const terminalHandle = page.getByRole("separator", { name: "Resize terminal" });
  const edge = await terminalHandle.boundingBox();
  if (!edge) throw new Error("no terminal handle");
  await page.mouse.move(edge.x + 200, edge.y + edge.height / 2);
  await page.mouse.down();
  await page.mouse.move(edge.x + 200, edge.y - 100, { steps: 5 });
  await page.mouse.up();
  await expect
    .poll(async () => (await terminal.boundingBox())?.height ?? 0)
    .toBeGreaterThan(height + 60);

  await terminalHandle.dblclick();
  await expect.poll(async () => Math.round((await terminal.boundingBox())?.height ?? 0)).toBe(260);
});

test("Esc closes the settings even when the focus is not inside them", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("complementary").first()).toBeVisible();

  await page.keyboard.press("Control+,");
  const settings = page.getByRole("dialog", { name: "Settings" });
  await expect(settings).toBeVisible();
  await settings.getByRole("heading", { name: "Settings" }).click();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  await page.keyboard.press("Escape");

  await expect(settings).toBeHidden();
});

test("stages and commits from the Git dock", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("complementary").first()).toBeVisible();

  await page.getByRole("button", { name: "Open Git panel" }).click();
  const dock = page.getByRole("complementary", { name: "Git" });
  await expect(dock).toContainText("main");
  await dock.getByRole("button", { name: "Stage all" }).click();
  await dock.getByRole("textbox", { name: "Commit message" }).fill("feat: from the dock");
  await dock.getByRole("button", { name: /^Commit/ }).click();
  await expect(dock).toContainText("No changes to commit");

  await dock.getByRole("tab", { name: "History" }).click();
  await expect(dock.getByRole("list", { name: "History" })).toContainText("feat: from the dock");
  await dock.getByRole("button", { name: "Close Git panel" }).click();
  await expect(dock).toBeHidden();
});

test("changes a keyboard shortcut and uses it", async ({ page }) => {
  await page.goto("/");
  const explorer = page.getByRole("complementary", { name: "Explorer" });
  await expect(explorer).toBeVisible();

  await page.keyboard.press("Control+,");
  const settings = page.getByRole("dialog", { name: "Settings" });
  await settings.getByRole("button", { name: "Change shortcut for Toggle side bar" }).click();
  await page.keyboard.press("Control+Shift+J");
  await expect(settings.getByLabel("Shortcut for Toggle side bar", { exact: true })).toHaveText(
    "Ctrl+Shift+J",
  );
  await page.keyboard.press("Escape");

  await page.keyboard.press("Control+b");
  await expect(explorer).toBeVisible();
  await page.keyboard.press("Control+Shift+J");
  await expect(explorer).toBeHidden();
});

test("customizes the terminal colors and cursor from the settings", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("complementary").first()).toBeVisible();

  await page.keyboard.press("Control+,");
  const terminalSection = page.getByRole("region", { name: "Terminal" });
  await terminalSection.getByRole("combobox", { name: "Colors" }).selectOption("Paper");
  await terminalSection.getByRole("combobox", { name: "Cursor" }).selectOption("bar");
  await page.keyboard.press("Escape");

  await page.keyboard.press("Control+Backquote");
  const view = page.locator(".terminal-view").first();
  await expect(view).toHaveCSS("background-color", "rgb(250, 247, 240)");
});

test("searches the settings", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("complementary").first()).toBeVisible();

  await page.keyboard.press("Control+,");
  const settings = page.getByRole("dialog", { name: "Settings" });
  const search = settings.getByRole("searchbox", { name: "Search settings" });
  await expect(search).toBeFocused();
  await search.fill("tab size");

  await expect(settings.getByRole("combobox", { name: "Tab size" })).toBeVisible();
  await expect(settings.getByRole("combobox", { name: "Theme" })).toBeHidden();
  await expect(
    settings.getByRole("checkbox", { name: "Reopen the last folder on start" }),
  ).toBeHidden();
});

test("settings switches follow the theme accent", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("complementary").first()).toBeVisible();

  await page.keyboard.press("Control+,");
  const toggle = page
    .getByRole("dialog", { name: "Settings" })
    .getByRole("checkbox", { name: "Status bar" });
  await expect(toggle).toBeChecked();
  await expect(toggle).toHaveCSS("width", "34px");
  const accent = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim(),
  );
  const background = await toggle.evaluate((element) => getComputedStyle(element).backgroundColor);
  const toRgb = (hex: string) =>
    `rgb(${[1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;
  expect(background).toBe(toRgb(accent));
});
