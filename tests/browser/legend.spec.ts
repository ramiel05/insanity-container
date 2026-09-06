import { expect, test } from "@playwright/test";

test("renders the Legend above the North Stars section", async ({ page }) => {
  await page.goto("/");
  const legend = page.getByRole("region", { name: "Legend" });
  await expect(legend).toBeVisible();
  await expect(legend.getByText("Blueshift", { exact: true })).toBeVisible();
  await expect(legend.getByText("Star", { exact: true })).toBeVisible();
  await expect(legend.getByText("North Star", { exact: true })).toBeVisible();
  await expect(legend).toHaveText(/goal-oriented body of work/i);
  const northStars = page.getByRole("heading", { name: "North Stars" });
  await expect(northStars).toBeVisible();
  const legendTop = (await legend.boundingBox())!.y;
  const northStarsTop = (await northStars.boundingBox())!.y;
  expect(legendTop).toBeLessThan(northStarsTop);
});
