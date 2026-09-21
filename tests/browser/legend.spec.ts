import { expect, test } from "./auth";

test("renders the Legend above the North Stars section", async ({ page }) => {
  await page.goto("/");
  const legend = page.getByRole("region", { name: "Legend" });
  await expect(legend).toBeVisible();
  await expect(legend.getByText("Blueshift", { exact: true })).toBeVisible();
  await expect(legend.getByText("Star", { exact: true })).toBeVisible();
  await expect(legend.getByText("North Star", { exact: true })).toBeVisible();
  await expect(legend).toHaveText(/goal-oriented body of work/iu);
  const northStars = page.getByRole("heading", { name: "North Stars" });
  await expect(northStars).toBeVisible();
  const legendBox = await legend.boundingBox();
  const northStarsBox = await northStars.boundingBox();
  if (legendBox === null || northStarsBox === null) {
    throw new Error("Legend or North Stars heading not rendered");
  }
  expect(legendBox.y).toBeLessThan(northStarsBox.y);
});
