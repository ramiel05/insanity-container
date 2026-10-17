import type { Page } from "@playwright/test";
import { expect, test } from "./auth";
import { centrePanelLocator, clearLeftoverBlackhole } from "./blackhole-helpers";

test.beforeEach(async ({ page }) => {
  await clearLeftoverBlackhole(page);
});

test.afterEach(async ({ page }) => {
  await clearLeftoverBlackhole(page);
});

async function createBlueshift(page: Page, name: string): Promise<void> {
  await page.getByRole("button", { name: "+ New Blueshift" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("heading", { name }).first()).toBeVisible();
}

test("a double-click on Create lands one Blueshift", async ({ page }) => {
  const name = `Twice clicked ${crypto.randomUUID().slice(0, 8)}`;
  let posts = 0;
  await page.route("**/api/blueshifts", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    posts += 1;
    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });
    await route.continue();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "+ New Blueshift" }).click();
  await page.getByLabel("Name").fill(name);
  await expect(page.getByRole("button", { name: "Create" })).toBeEnabled();
  await page.getByRole("button", { name: "Create" }).dblclick();
  await expect(page.getByRole("heading", { name })).toBeVisible({ timeout: 10_000 });
  expect(posts).toBe(1);
  await expect(page.getByLabel("Blueshifts", { exact: true }).getByLabel(`Magnitude of ${name}`)).toHaveCount(1);
});

test("a double-click on Add Star lands one Star", async ({ page }) => {
  const name = `Star shot once ${crypto.randomUUID().slice(0, 8)}`;
  const title = `Sketched route ${crypto.randomUUID().slice(0, 8)}`;
  await page.goto("/");
  await createBlueshift(page, name);
  let posts = 0;
  await page.route("**/api/blueshifts/*/stars", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    posts += 1;
    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });
    await route.continue();
  });
  await page.getByLabel("New Star title").fill(title);
  await page.getByRole("button", { name: "Add Star" }).dblclick();
  await expect(page.getByText(title).first()).toBeVisible({ timeout: 10_000 });
  expect(posts).toBe(1);
  await expect(page.getByText(title)).toHaveCount(1);
});

test("a double-click on Confirm deletes once", async ({ page }) => {
  const name = `Deleted with a hiccup ${crypto.randomUUID().slice(0, 8)}`;
  const title = `Fizzle out ${crypto.randomUUID().slice(0, 8)}`;
  await page.goto("/");
  await createBlueshift(page, name);
  await page.getByLabel("New Star title").fill(title);
  await page.getByRole("button", { name: "Add Star" }).click();
  await expect(page.getByText(title).first()).toBeVisible();
  let deletes = 0;
  await page.route("**/api/blueshifts/stars/*", async (route) => {
    if (route.request().method() !== "DELETE") {
      await route.continue();
      return;
    }
    deletes += 1;
    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });
    await route.continue();
  });
  await page.getByRole("button", { name: `Delete ${title}` }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete" }).dblclick();
  await expect(page.getByText(title).first()).toBeHidden({ timeout: 10_000 });
  expect(deletes).toBe(1);
});

test("a double-click on Save lands one settings write", async ({ page }) => {
  let saves = 0;
  await page.route("**/api/settings", async (route) => {
    if (route.request().method() !== "PATCH") {
      await route.continue();
      return;
    }
    saves += 1;
    await new Promise((resolve) => {
      setTimeout(resolve, 400);
    });
    await route.continue();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("combobox").first().selectOption({ index: 1 });
  await dialog.getByRole("button", { name: "Save" }).dblclick();
  await expect(dialog).toBeHidden({ timeout: 10_000 });
  expect(saves).toBe(1);
});

test("the Create button disables at first fire and re-enables after a failure", async ({ page }) => {
  await page.route("**/api/blueshifts", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 800);
    });
    await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Boom" }) });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "+ New Blueshift" }).click();
  await page.getByLabel("Name").fill(`Disabled in flight ${crypto.randomUUID().slice(0, 8)}`);
  const create = page.getByRole("button", { name: "Create" });
  await create.click();
  await expect(create).toBeDisabled();
  await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible({ timeout: 10_000 });
  await expect(create).toBeEnabled();
});

test("the Add Star button disables at first fire and re-enables after a failure", async ({ page }) => {
  const name = `Pending star create ${crypto.randomUUID().slice(0, 8)}`;
  await page.route("**/api/blueshifts/*/stars", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 800);
    });
    await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Boom" }) });
  });
  await page.goto("/");
  await createBlueshift(page, name);
  await page.getByLabel("New Star title").fill("Sketch the route");
  const addStar = page.getByRole("button", { name: "Add Star" });
  await addStar.click();
  await expect(addStar).toBeDisabled();
  await expect(centrePanelLocator(page).getByRole("alert")).toBeVisible({ timeout: 10_000 });
  await page.getByLabel("New Star title").fill("Sketch the route again");
  await expect(addStar).toBeEnabled();
});

test("the Save button disables at first fire and re-enables after a failure", async ({ page }) => {
  await page.route("**/api/settings", async (route) => {
    if (route.request().method() !== "PATCH") {
      await route.continue();
      return;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 800);
    });
    await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Boom" }) });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("combobox").first().selectOption({ index: 1 });
  const save = dialog.getByRole("button", { name: "Save" });
  await save.click();
  await expect(save).toBeDisabled();
  await expect(dialog.getByRole("alert")).toBeVisible({ timeout: 10_000 });
  await expect(save).toBeEnabled();
});

test("independent targets are never blocked by another action's flight", async ({ page }) => {
  const name = `Parallel sky ${crypto.randomUUID().slice(0, 8)}`;
  const blackholeTitle = `Swallow ${crypto.randomUUID().slice(0, 8)}`;
  const parallelTitle = `Pin the peak ${crypto.randomUUID().slice(0, 8)}`;
  await page.goto("/");
  await createBlueshift(page, name);
  await page.getByLabel("New Star title").fill(blackholeTitle);
  await page.getByRole("button", { name: "Add Star" }).click();
  await expect(page.getByText(blackholeTitle).first()).toBeVisible();

  await page.route("**/api/blueshifts/*/stars", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 800);
    });
    await route.continue();
  });

  await page.getByLabel("New Star title").fill(parallelTitle);
  await page.getByRole("button", { name: "Add Star" }).click();
  await expect(page.getByRole("button", { name: "Add Star" })).toBeDisabled();

  await page.getByRole("button", { name: `Collapse ${blackholeTitle} into a Blackhole` }).click({ timeout: 3_000 });
  const region = page.getByRole("region", { name: "Blackhole" });
  await expect(region).toBeVisible();
  await expect(region.getByLabel(`Complete ${blackholeTitle}`)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(parallelTitle).first()).toBeVisible({ timeout: 10_000 });
});
