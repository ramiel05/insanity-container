import type { Page } from "@playwright/test";
import { expect, test } from "./auth";

interface ApiCall {
  readonly method: string;
  readonly path: string;
}

function watchApi(page: Page): { readonly calls: ApiCall[]; readonly mark: () => number } {
  const calls: ApiCall[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/")) calls.push({ method: request.method(), path: url.pathname });
  });
  return { calls, mark: (): number => calls.length };
}

const gets = (calls: readonly ApiCall[], path: RegExp): readonly ApiCall[] =>
  calls.filter((call) => call.method === "GET" && path.test(call.path));

const expectRefetch = async (calls: readonly ApiCall[], start: number, path: RegExp): Promise<void> => {
  await expect.poll(() => gets(calls.slice(start), path), { timeout: 10_000 }).not.toHaveLength(0);
};

async function createShift(page: Page, button: string, name: string): Promise<void> {
  await page.getByRole("button", { name: button }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("heading", { name }).first()).toBeVisible();
}

test("creating a Blueshift refetches the Blueshift list only", async ({ page }) => {
  const { calls, mark } = watchApi(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "North Stars" })).toBeVisible();
  const name = `Quiet starter ${crypto.randomUUID().slice(0, 8)}`;
  const start = mark();
  await createShift(page, "+ New Blueshift", name);
  await expectRefetch(calls, start, /^\/api\/blueshifts$/u);
  const slice = calls.slice(start);
  expect(gets(slice, /^\/api\/redshifts$/u)).toHaveLength(0);
  expect(gets(slice, /north-stars/u)).toHaveLength(0);
});

test("adding a Star refetches only that Blueshift's Stars", async ({ page }) => {
  const { calls, mark } = watchApi(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "North Stars" })).toBeVisible();
  const name = `Starless start ${crypto.randomUUID().slice(0, 8)}`;
  await createShift(page, "+ New Blueshift", name);
  const start = mark();
  await page.getByLabel("New Star title").fill("Sketch the route");
  await page.getByRole("button", { name: "Add Star" }).click();
  await expect(page.getByText("Sketch the route").first()).toBeVisible();
  await expectRefetch(calls, start, /^\/api\/blueshifts\/[^/]+\/stars$/u);
  const slice = calls.slice(start);
  expect(gets(slice, /^\/api\/blueshifts$/u)).toHaveLength(0);
  expect(gets(slice, /north-stars/u)).toHaveLength(0);
  expect(gets(slice, /^\/api\/redshifts/u)).toHaveLength(0);
});

test("promoting a Star to North Star refetches Stars and North Stars but not the lists", async ({ page }) => {
  const { calls, mark } = watchApi(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "North Stars" })).toBeVisible();
  const name = `North bound ${crypto.randomUUID().slice(0, 8)}`;
  await createShift(page, "+ New Blueshift", name);
  await page.getByLabel("New Star title").fill("Pin the peak");
  await page.getByRole("button", { name: "Add Star" }).click();
  await expect(page.getByText("Pin the peak").first()).toBeVisible();
  const start = mark();
  await page.getByRole("button", { name: "Make Pin the peak a North Star" }).click();
  await expectRefetch(calls, start, /^\/api\/north-stars$/u);
  await expectRefetch(calls, start, /^\/api\/blueshifts\/[^/]+\/stars$/u);
  const slice = calls.slice(start);
  expect(gets(slice, /^\/api\/blueshifts$/u)).toHaveLength(0);
  expect(gets(slice, /^\/api\/redshifts$/u)).toHaveLength(0);
});

test("promoting a Redshift refetches the Redshift list only", async ({ page }) => {
  const { calls, mark } = watchApi(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "North Stars" })).toBeVisible();
  const name = `Drift practice ${crypto.randomUUID().slice(0, 8)}`;
  await createShift(page, "+ New Redshift", name);
  const start = mark();
  await page
    .getByLabel("Redshifts", { exact: true })
    .getByLabel(`Magnitude of ${name}`)
    .selectOption({ label: "First" });
  await expect(
    page.getByLabel("Redshifts", { exact: true }).getByLabel("First Magnitude").getByText(name),
  ).toBeVisible();
  await expectRefetch(calls, start, /^\/api\/redshifts$/u);
  const slice = calls.slice(start);
  expect(gets(slice, /^\/api\/blueshifts$/u)).toHaveLength(0);
  expect(gets(slice, /north-stars/u)).toHaveLength(0);
});
