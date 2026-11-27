import { expect, test } from "@playwright/test";

test("shows Docker containers, stops one and follows another's logs", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Open folder" })).toBeVisible();

  await page.keyboard.press("Control+Shift+D");
  const docker = page.getByRole("complementary", { name: "Docker" });
  const running = docker.getByRole("region", { name: "Running containers" });
  const stopped = docker.getByRole("region", { name: "Stopped containers" });
  await expect(running.getByText("shop-db-1")).toBeVisible();
  await expect(stopped.getByText("scratch")).toBeVisible();

  await docker.getByRole("button", { name: "Stop shop-db-1" }).click();
  await expect(stopped.getByText("shop-db-1")).toBeVisible();
  await expect(running).toHaveCount(0);

  await docker.getByRole("button", { name: "Logs of scratch" }).click();
  await expect(page.getByRole("tab", { name: "scratch" })).toBeVisible();
});
