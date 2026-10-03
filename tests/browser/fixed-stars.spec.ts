import type { Locator, Page } from "@playwright/test";
import { z } from "zod";
import { expect, test } from "./auth";

const starsSchema = z.array(z.object({ completedAt: z.number().nullable() }).passthrough());

async function createRedshift(page: Page, name: string): Promise<void> {
  await page.getByRole("button", { name: "+ New Redshift" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("heading", { name }).first()).toBeVisible();
}

async function addStar(page: Page, title: string, fixed: boolean): Promise<void> {
  await page.getByLabel("New Star title").fill(title);
  if (!fixed) await page.getByLabel("Fixed", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Add Star" }).click();
  await expect(page.getByText(title).first()).toBeVisible();
}

function starRow(page: Page, title: string): Locator {
  return page.getByLabel(`Complete ${title}`).locator("..");
}

test("the add-Star affordance offers a Fixed toggle that is on by default", async ({ page }) => {
  await page.goto("/");
  await createRedshift(page, `Fixed defaults ${crypto.randomUUID().slice(0, 8)}`);
  await expect(page.getByLabel("Fixed", { exact: true })).toBeChecked();
});

test("a non-Fixed Star stays done across a day boundary while a Fixed Star resets", async ({ page }) => {
  await page.goto("/");
  const name = `One-offs ${crypto.randomUUID().slice(0, 8)}`;
  await createRedshift(page, name);
  await addStar(page, "Stretch daily", true);
  await addStar(page, "Buy the squat rack", false);
  await expect(starRow(page, "Stretch daily")).toHaveCSS("background-image", /linear-gradient/u);
  await expect(starRow(page, "Buy the squat rack")).toHaveCSS("background-image", /(none|^$)/u);
  await page.getByLabel("Complete Stretch daily").click();
  await page.getByLabel("Complete Buy the squat rack").click();
  await expect(page.getByLabel("Complete Stretch daily")).toBeChecked();
  await expect(page.getByLabel("Complete Buy the squat rack")).toBeChecked();

  const yesterday = Date.now() - 24 * 60 * 60 * 1000;
  await page.route(/\/api\/redshifts\/[^/]+\/stars$/u, async (route) => {
    const response = await route.fetch();
    if (route.request().method() !== "GET") {
      await route.fulfill({ response });
      return;
    }
    const stars = starsSchema.parse(await response.json());
    const aged = stars.map((star) => (star.completedAt === null ? star : { ...star, completedAt: yesterday }));
    await route.fulfill({ response, json: aged });
  });
  await page.reload();
  await page.getByRole("button", { name, exact: true }).click();
  await expect(page.getByLabel("Complete Stretch daily")).not.toBeChecked();
  await expect(page.getByLabel("Complete Buy the squat rack")).toBeChecked();
});
