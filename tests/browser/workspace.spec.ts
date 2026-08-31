import { expect, test } from "@playwright/test";

test("creates a Blueshift and its first Star", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "North Stars" })).toBeVisible();
  await expect(page.getByRole("button", { name: "+ New Star" })).toBeDisabled();
  await page.getByRole("button", { name: "+ New Blueshift" }).click();
  await page.getByLabel("Name").fill("Morning orbit");
  await page.getByLabel(/Goal/).fill("Make progress");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("heading", { name: "Morning orbit" })).toBeVisible();
  await page.getByRole("button", { name: "+ New Star" }).click();
  await expect(page.getByText("Blueshift: Morning orbit")).toBeVisible();
  await page.getByLabel("Title").fill("Sketch the route");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Sketch the route")).toBeVisible();
});
