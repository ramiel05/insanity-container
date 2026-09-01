import { expect, test } from "@playwright/test";

test("shows a visible error with a local fix hint when the API is unreachable", async ({ page }) => {
  test.setTimeout(30_000);
  await page.route("**/api/**", (route) => route.abort());
  await page.goto("/");
  const alert = page.getByRole("alert");
  await expect(alert).toBeVisible({ timeout: 15_000 });
  await expect(alert).toContainText("bun run dev");
});

test("keeps the creation modal open and shows an error when creating a Blueshift fails", async ({ page }) => {
  await page.route("**/api/blueshifts", (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Boom" }) }));
  await page.goto("/");
  await page.getByRole("button", { name: "+ New Blueshift" }).click();
  await page.getByLabel("Name").fill("Morning orbit");
  await page.getByRole("button", { name: "Create" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(dialog.getByLabel("Name")).toHaveValue("Morning orbit");
});
