import type { Locator, Page } from "@playwright/test";
import { expect } from "./auth";

export const DIMMED = "[data-dimmed]";

export async function createBlueshiftWithStars(page: Page, name: string, titles: readonly string[]): Promise<void> {
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

export async function attemptInertClick(control: Locator): Promise<void> {
  await expect(control.click({ timeout: 500 })).rejects.toThrow(/timeout/iu);
}

export function centreLocator(page: Page): Locator {
  return page.locator(DIMMED).filter({ has: page.getByRole("button", { name: "Add Star" }) });
}

export function centrePanelLocator(page: Page): Locator {
  return page.locator("section").filter({ has: page.getByRole("button", { name: "Add Star" }) });
}

export function evaporateDialog(page: Page): {
  readonly dialog: Locator;
  readonly input: Locator;
  readonly button: Locator;
} {
  const dialog = page.getByRole("dialog");
  return {
    dialog,
    input: dialog.getByLabel("Type evaporate to confirm"),
    button: dialog.getByRole("button", { name: "Evaporate", exact: true }),
  };
}

export function evaporateButton(page: Page, title: string): Locator {
  return page.getByRole("button", { name: `Evaporate ${title} back into its Blueshift` });
}

export function legendLocator(page: Page): Locator {
  return page.getByRole("region", { name: "Legend" });
}

export async function clearLeftoverBlackhole(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "North Stars" })).toBeVisible();
  await expect(page.getByRole("status")).toBeHidden();
  const region = page.getByRole("region", { name: "Blackhole" });
  if ((await region.count()) === 0) return;
  await region
    .getByLabel(/Complete /u)
    .first()
    .click();
  await expect(region).toBeHidden();
}
