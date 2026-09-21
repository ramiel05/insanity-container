import { expect, test } from "./auth";

test("creates a Blueshift and its first Star", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "North Stars" })).toBeVisible();
  await expect(page.getByText("Select a Redshift or Blueshift to see its Stars.")).toBeVisible();
  await page.getByRole("button", { name: "+ New Blueshift" }).click();
  await page.getByLabel("Name").fill("Morning orbit");
  await page.getByLabel(/Goal/u).fill("Make progress");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("heading", { name: "Morning orbit" }).first()).toBeVisible();
  await page.getByLabel("New Star title").fill("Sketch the route");
  await page.getByRole("button", { name: "Add Star" }).click();
  await expect(page.getByText("Sketch the route").first()).toBeVisible();
});

test("adds Stars in quick succession from the inline input", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "+ New Blueshift" }).click();
  await page.getByLabel("Name").fill("Evening orbit");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("heading", { name: "Evening orbit" }).first()).toBeVisible();
  const input = page.getByLabel("New Star title");
  for (const title of ["Chart the currents", "Log the bearing", "Plot the return"]) {
    await input.fill(title);
    await page.keyboard.press("Enter");
  }
  await expect(input).toBeFocused();
  await expect(page.getByText("Chart the currents").first()).toBeVisible();
  await expect(page.getByText("Log the bearing").first()).toBeVisible();
  await expect(page.getByText("Plot the return").first()).toBeVisible();
});

test("new Blueshifts start at Fourth Magnitude and can be promoted", async ({ page }) => {
  const name = `Dim newcomer ${crypto.randomUUID().slice(0, 8)}`;
  await page.goto("/");
  await page.getByRole("button", { name: "+ New Blueshift" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("heading", { name }).first()).toBeVisible();
  const blueshifts = page.getByLabel("Blueshifts", { exact: true });
  await expect(blueshifts.getByLabel("Fourth Magnitude").getByText(name)).toBeVisible();
  await blueshifts.getByLabel(`Magnitude of ${name}`).selectOption({ label: "First" });
  await expect(blueshifts.getByLabel("First Magnitude").getByText(name)).toBeVisible();
  await expect(blueshifts.getByLabel("Fourth Magnitude").getByText(name)).toHaveCount(0);
});

test("new Redshifts start at Fourth Magnitude and can be promoted", async ({ page }) => {
  const name = `Dim practice ${crypto.randomUUID().slice(0, 8)}`;
  await page.goto("/");
  await page.getByRole("button", { name: "+ New Redshift" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("heading", { name }).first()).toBeVisible();
  const redshifts = page.getByLabel("Redshifts", { exact: true });
  await expect(redshifts.getByLabel("Fourth Magnitude").getByText(name)).toBeVisible();
  await redshifts.getByLabel(`Magnitude of ${name}`).selectOption({ label: "First" });
  await expect(redshifts.getByLabel("First Magnitude").getByText(name)).toBeVisible();
  await expect(redshifts.getByLabel("Fourth Magnitude").getByText(name)).toHaveCount(0);
});
