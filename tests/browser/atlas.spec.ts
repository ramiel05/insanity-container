import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { z } from "zod";

const legendEntrySchema = z.object({ section: z.string(), term: z.string(), definition: z.string() });
const legend = z.array(legendEntrySchema).parse(JSON.parse(readFileSync("packages/legend/src/legend.json", "utf8")));

const atlasURL = "http://localhost:4173/atlas/";

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/(^-|-$)/gu, "");
}

test("the sidebar links to every Legend concept", async ({ page }) => {
  await page.goto(atlasURL);
  const sidebar = page.getByRole("navigation", { name: "Atlas contents" });
  await expect(sidebar).toBeVisible();
  for (const entry of legend) {
    const link = sidebar.locator(`a[href="#concept-${slug(entry.term)}"]`);
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", `#concept-${slug(entry.term)}`);
  }
});

test("the Legend section includes every concept from the artifact", async ({ page }) => {
  await page.goto(atlasURL);
  const legendSection = page.getByRole("region", { name: "Legend" });
  await expect(legendSection).toBeVisible();
  for (const entry of legend) {
    const concept = legendSection.locator(`#concept-${slug(entry.term)}`);
    await expect(concept).toBeVisible();
    await expect(concept).toContainText(entry.definition.slice(0, 40));
  }
});

const guideTitles = [
  "Turn goals into Blueshifts",
  "Decompose Blueshifts into Stars",
  "Rank shifts by Magnitude",
  "Designate North Stars for the day",
  "The end-of-day review",
  "Practice endlessly with Redshifts",
];

test("each Guide anchor resolves from the sidebar and carries an enforcement tag", async ({ page }) => {
  await page.goto(atlasURL);
  const sidebar = page.getByRole("navigation", { name: "Atlas contents" });
  for (const title of guideTitles) {
    await sidebar.getByRole("link", { name: title }).click();
    const guide = page.locator(`#guide-${slug(title)}`);
    await expect(guide).toBeVisible();
    await expect(guide.getByRole("heading", { name: title })).toBeVisible();
    await expect(guide.locator(".enforcement-tag")).toHaveText(/^(enforced|guidance)$/iu);
  }
});

test("no guide claims enforcement is absent across the board", async ({ page }) => {
  await page.goto(atlasURL);
  await expect(page.getByText(/Polaris does not enforce this guide/iu)).toHaveCount(0);
});

test("the Redshift guide is marked enforced and the North Star guide permits exceeding one to three", async ({
  page,
}) => {
  await page.goto(atlasURL);
  const redshiftGuide = page.locator(`#guide-${slug("Practice endlessly with Redshifts")}`);
  await expect(redshiftGuide.locator(".enforcement-tag")).toHaveText(/enforced/iu);
  const northStarGuide = page.locator(`#guide-${slug("Designate North Stars for the day")}`);
  await expect(northStarGuide).toContainText(/one to three is .*advice/iu);
  await expect(northStarGuide.locator(".enforcement-tag")).toHaveText(/guidance/iu);
});
