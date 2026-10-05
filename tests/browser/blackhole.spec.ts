import type { Page } from "@playwright/test";
import { expect, test } from "./auth";

const BLOCKED_TOOLTIP = "A Blackhole exists: complete, delete, or evaporate it before collapsing another Star";

async function createBlueshiftWithStars(page: Page, name: string, titles: readonly string[]): Promise<void> {
  await page.getByRole("button", { name: "+ New Blueshift" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("heading", { name }).first()).toBeVisible();
  for (const title of titles) {
    await page.getByLabel("New Star title").fill(title);
    await page.getByRole("button", { name: "Add Star" }).click();
    await expect(page.getByText(title).first()).toBeVisible();
  }
}

async function clearLeftoverBlackhole(page: Page): Promise<void> {
  const region = page.getByRole("region", { name: "Blackhole" });
  if ((await region.count()) === 0) return;
  await region
    .getByLabel(/Complete /u)
    .first()
    .click();
  await expect(region).toBeHidden();
}

async function setUp(page: Page): Promise<void> {
  const blackholesLoaded = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === "/api/blackholes" && response.request().method() === "GET";
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "North Stars" })).toBeVisible();
  await blackholesLoaded;
  await clearLeftoverBlackhole(page);
}

test("hides the Blackhole section when no Blackhole exists", async ({ page }) => {
  await setUp(page);
  await expect(page.getByRole("region", { name: "Blackhole" })).toHaveCount(0);
});

test("collapsing a Star shows the Blackhole above North Stars, centered with a solid black border", async ({
  page,
}) => {
  await setUp(page);
  const name = `Collapsed ${crypto.randomUUID().slice(0, 8)}`;
  await createBlueshiftWithStars(page, name, ["Swallow the sky", "Tidy the deck"]);
  await expect(page.getByRole("region", { name: "Blackhole" })).toHaveCount(0);
  await page.getByRole("button", { name: "Collapse Swallow the sky into a Blackhole" }).click();

  const region = page.getByRole("region", { name: "Blackhole" });
  await expect(region).toBeVisible();
  await expect(region.getByText("Swallow the sky")).toBeVisible();

  const row = region.getByLabel("Complete Swallow the sky").locator("..");
  await expect(row).toHaveCSS("border-width", "5px");
  await expect(row).toHaveCSS("border-style", "solid");
  await expect(row).toHaveCSS("border-color", "rgb(0, 0, 0)");

  const blackholeBox = await region.boundingBox();
  const northStarsBox = await page.getByRole("region", { name: "North Stars" }).boundingBox();
  if (blackholeBox === null || northStarsBox === null) {
    throw new Error("Blackhole or North Stars region has no bounding box");
  }
  expect(blackholeBox.y).toBeLessThan(northStarsBox.y);

  const regionBox = await region.boundingBox();
  const rowBox = await row.boundingBox();
  if (regionBox === null || rowBox === null) {
    throw new Error("Blackhole region or row has no bounding box");
  }
  const regionCenter = regionBox.x + regionBox.width / 2;
  const rowCenter = rowBox.x + rowBox.width / 2;
  expect(Math.abs(regionCenter - rowCenter)).toBeLessThan(2);
});

test("ticking the Blackhole complete clears the section and frees the collapse affordance", async ({ page }) => {
  await setUp(page);
  const name = `Finished hole ${crypto.randomUUID().slice(0, 8)}`;
  await createBlueshiftWithStars(page, name, ["Swallow the sky", "Tidy the deck"]);
  await page.getByRole("button", { name: "Collapse Swallow the sky into a Blackhole" }).click();
  const region = page.getByRole("region", { name: "Blackhole" });
  await expect(region.getByLabel("Complete Swallow the sky")).toBeVisible();
  await expect(page.getByRole("button", { name: "Collapse Tidy the deck into a Blackhole" })).toBeDisabled();

  await region.getByLabel("Complete Swallow the sky").click();
  await expect(region).toBeHidden();
  const freed = page.getByRole("button", { name: "Collapse Tidy the deck into a Blackhole" });
  await expect(freed).toBeEnabled();
  await expect(freed).not.toHaveAttribute("title", BLOCKED_TOOLTIP);
});

test("deleting the Blackhole row lifts the section", async ({ page }) => {
  await setUp(page);
  const name = `Deleted hole ${crypto.randomUUID().slice(0, 8)}`;
  await createBlueshiftWithStars(page, name, ["Swallow the sky"]);
  await page.getByRole("button", { name: "Collapse Swallow the sky into a Blackhole" }).click();
  const region = page.getByRole("region", { name: "Blackhole" });
  await expect(region).toBeVisible();

  await region.getByRole("button", { name: "Delete Swallow the sky" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
  await expect(region).toBeHidden();
});

test("the Collapse affordance is disabled with an explanatory tooltip while a Blackhole exists", async ({ page }) => {
  await setUp(page);
  const name = `Blocked collapse ${crypto.randomUUID().slice(0, 8)}`;
  await createBlueshiftWithStars(page, name, ["Swallow the sky", "Tidy the deck"]);
  await page.getByRole("button", { name: "Collapse Swallow the sky into a Blackhole" }).click();
  const region = page.getByRole("region", { name: "Blackhole" });
  await expect(region).toBeVisible();

  const blocked = page.getByRole("button", { name: "Collapse Tidy the deck into a Blackhole" });
  await expect(blocked).toBeDisabled();
  await expect(blocked).toHaveAttribute("title", BLOCKED_TOOLTIP);
});

test("collapse applies before the server answers", async ({ page }) => {
  await setUp(page);
  const name = `Optimistic hole ${crypto.randomUUID().slice(0, 8)}`;
  await createBlueshiftWithStars(page, name, ["Swallow the sky"]);
  await page.route("**/api/blueshifts/stars/*", async (route) => {
    if (route.request().method() !== "PATCH") {
      await route.continue();
      return;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 1_000);
    });
    await route.continue();
  });
  await page.getByRole("button", { name: "Collapse Swallow the sky into a Blackhole" }).click();
  await expect(page.getByRole("region", { name: "Blackhole" })).toBeVisible({ timeout: 500 });
});
