import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const legend = JSON.parse(
  readFileSync("packages/legend/src/legend.json", "utf8"),
) as { section: string; term: string; definition: string }[];

const atlasURL = "http://localhost:4173";

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

test("each Guide anchor resolves from the sidebar", async ({ page }) => {
  await page.goto(atlasURL);
  const sidebar = page.getByRole("navigation", { name: "Atlas contents" });
  const guideTitles = [
    "Turn goals into Blueshifts",
    "Decompose Blueshifts into Stars",
    "Choose one to three North Stars for the day",
    "The end-of-day review",
  ];
  for (const title of guideTitles) {
    await sidebar.getByRole("link", { name: title }).click();
    const guide = page.locator(`#guide-${slug(title)}`);
    await expect(guide).toBeVisible();
    await expect(guide.getByRole("heading", { name: title })).toBeVisible();
    await expect(guide).toContainText(/Polaris does not enforce this guide/i);
  }
});

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
