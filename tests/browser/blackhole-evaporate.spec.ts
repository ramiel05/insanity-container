import { expect, test } from "./auth";
import {
  centrePanelLocator,
  createBlueshiftWithStars,
  DIMMED,
  evaporateButton,
  evaporateDialog,
  clearLeftoverBlackhole,
} from "./blackhole-helpers";

test.afterEach(async ({ page }) => {
  await clearLeftoverBlackhole(page);
});

test("evaporation refuses any word but the exact one", async ({ page }) => {
  await clearLeftoverBlackhole(page);
  const name = `Stubborn hole ${crypto.randomUUID().slice(0, 8)}`;
  await createBlueshiftWithStars(page, name, ["Swallow the sky"]);
  await page.getByRole("button", { name: "Collapse Swallow the sky into a Blackhole" }).click();
  const region = page.getByRole("region", { name: "Blackhole" });
  await expect(region).toBeVisible();

  await evaporateButton(page, "Swallow the sky").click();
  const { dialog, input, button } = evaporateDialog(page);
  await expect(dialog).toBeVisible();
  await expect(button).toBeDisabled();

  await input.fill("evaporator");
  await expect(button).toBeDisabled();
  await input.fill("EVAPORATE");
  await expect(button).toBeDisabled();

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(region).toBeVisible();
});

test("evaporating returns the Star to its Blueshift and lifts the dim", async ({ page }) => {
  await clearLeftoverBlackhole(page);
  const name = `Released hole ${crypto.randomUUID().slice(0, 8)}`;
  await createBlueshiftWithStars(page, name, ["Swallow the sky", "Tidy the deck"]);
  await page.getByRole("button", { name: "Collapse Swallow the sky into a Blackhole" }).click();
  const region = page.getByRole("region", { name: "Blackhole" });
  await expect(region).toBeVisible();
  await expect(page.locator(DIMMED)).toHaveCount(4);

  await evaporateButton(page, "Swallow the sky").click();
  const { input, button } = evaporateDialog(page);
  await input.fill("evaporate");
  await expect(button).toBeEnabled();
  await button.click();

  await expect(region).toBeHidden();
  await expect(page.locator(DIMMED)).toHaveCount(0);

  const centre = centrePanelLocator(page);
  await expect(centre.getByText("Swallow the sky")).toBeVisible();
  await expect(centre.getByLabel("Complete Swallow the sky")).not.toBeChecked();
  await expect(centre).not.toHaveCSS("filter", /blur/u);

  await expect(page.getByRole("button", { name: "Collapse Tidy the deck into a Blackhole" })).toBeEnabled();
  await expect(page.getByRole("region", { name: "Blackhole" })).toHaveCount(0);
});

test("evaporation applies before the server answers", async ({ page }) => {
  await clearLeftoverBlackhole(page);
  const name = `Optimistic release ${crypto.randomUUID().slice(0, 8)}`;
  await createBlueshiftWithStars(page, name, ["Swallow the sky"]);
  await page.getByRole("button", { name: "Collapse Swallow the sky into a Blackhole" }).click();
  const region = page.getByRole("region", { name: "Blackhole" });
  await expect(region).toBeVisible();

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

  await evaporateButton(page, "Swallow the sky").click();
  const { input, button } = evaporateDialog(page);
  await input.fill("evaporate");
  await button.click();
  await expect(region).toBeHidden({ timeout: 500 });
});
