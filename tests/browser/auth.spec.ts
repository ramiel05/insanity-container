import { expect, test } from "@playwright/test";

test("signs in through the real GitHub social flow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /sign in with github/iu })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: /sign in with google/iu })).toBeVisible();
  await page.getByRole("button", { name: /sign in with github/iu }).click();
  await expect(page).toHaveURL(/github\.com\/login(\?|\/oauth)/iu, { timeout: 15_000 });
});
