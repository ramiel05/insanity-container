import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { unlinkSync } from "node:fs";
import { join } from "node:path";
import { createDb } from "./db";
import { blueshiftStars, redshiftStars } from "./db/schema";
import { createApp } from "./index";

const path = `/tmp/polaris-test-${crypto.randomUUID()}.sqlite`;
const serverRoot = join(import.meta.dir, "..");
const pushed = Bun.spawnSync(["bun", "run", "db:push"], {
  cwd: serverRoot,
  env: { ...process.env, DATABASE_URL: path },
  stdout: "pipe",
  stderr: "pipe",
});
if (pushed.exitCode !== 0) {
  throw new Error(`db:push failed:\n${new TextDecoder().decode(pushed.stderr)}`);
}
const storage = createDb(path);
const app = createApp(storage.db);
const request = (url: string, init?: RequestInit) => app.fetch(new Request(`http://test${url}`, init));

describe("health probe", () => {
  test("responds 200 with a JSON body at /health", async () => {
    const response = await request("/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});

describe("wayfinding API", () => {
  let firstBlueshift = "";
  let secondBlueshift = "";
  let firstStar = "";

  beforeAll(async () => {
    firstBlueshift = (await (await request("/api/blueshifts", { method: "POST", body: JSON.stringify({ name: "Launch", goal: "Ship it" }), headers: { "Content-Type": "application/json" } })).json()).id;
    secondBlueshift = (await (await request("/api/blueshifts", { method: "POST", body: JSON.stringify({ name: "Learn" }), headers: { "Content-Type": "application/json" } })).json()).id;
    expect((await request("/api/blueshifts")).status).toBe(200);
  });

  test("creates chronological Stars, toggles focus, and lists global North Stars", async () => {
    const create = await request(`/api/blueshifts/${firstBlueshift}/stars`, { method: "POST", body: JSON.stringify({ title: "Write outline" }), headers: { "Content-Type": "application/json" } });
    expect(create.status).toBe(201);
    firstStar = (await create.json()).id;
    const second = await request(`/api/blueshifts/${secondBlueshift}/stars`, { method: "POST", body: JSON.stringify({ title: "Read docs" }), headers: { "Content-Type": "application/json" } });
    expect(second.status).toBe(201);
    const secondStar = (await second.json()).id;
    expect((await (await request(`/api/blueshifts/${firstBlueshift}/stars`)).json()).map((star: { title: string }) => star.title)).toEqual(["Write outline"]);
    expect((await request(`/api/blueshifts/stars/${firstStar}`, { method: "PATCH", body: JSON.stringify({ northStar: true }), headers: { "Content-Type": "application/json" } })).status).toBe(200);
    expect((await request(`/api/blueshifts/stars/${secondStar}`, { method: "PATCH", body: JSON.stringify({ northStar: true, completed: true }), headers: { "Content-Type": "application/json" } })).status).toBe(200);
    const stars = await (await request("/api/north-stars")).json();
    expect(stars.map((star: { title: string }) => star.title)).toEqual(["Write outline", "Read docs"]);
    expect(stars[1].completedAt).toBeNumber();
    expect((await request(`/api/blueshifts/stars/${firstStar}`, { method: "PATCH", body: JSON.stringify({ northStar: false }), headers: { "Content-Type": "application/json" } })).status).toBe(200);
    expect((await (await request("/api/north-stars")).json()).map((star: { title: string }) => star.title)).toEqual(["Read docs"]);
    expect((await request(`/api/blueshifts/stars/${firstStar}`, { method: "DELETE" })).status).toBe(204);
  });

  test("stamps completedAt with the server clock on tick and nulls it on untick", async () => {
    const create = await request(`/api/blueshifts/${firstBlueshift}/stars`, { method: "POST", body: JSON.stringify({ title: "Clock me" }), headers: { "Content-Type": "application/json" } });
    const star = await create.json();
    expect(star.completedAt).toBeNull();
    const before = Date.now();
    const ticked = await (await request(`/api/blueshifts/stars/${star.id}`, { method: "PATCH", body: JSON.stringify({ completed: true }), headers: { "Content-Type": "application/json" } })).json();
    expect(ticked.completedAt).toBeNumber();
    expect(ticked.completedAt).toBeGreaterThanOrEqual(before);
    expect(ticked.completedAt).toBeLessThanOrEqual(Date.now());
    const unticked = await (await request(`/api/blueshifts/stars/${star.id}`, { method: "PATCH", body: JSON.stringify({ completed: false }), headers: { "Content-Type": "application/json" } })).json();
    expect(unticked.completedAt).toBeNull();
  });

  test("serves flat star member routes no more", async () => {
    const create = await request(`/api/blueshifts/${secondBlueshift}/stars`, { method: "POST", body: JSON.stringify({ title: "Still here" }), headers: { "Content-Type": "application/json" } });
    const star = await create.json();
    expect((await request(`/api/stars/${star.id}`, { method: "PATCH", body: JSON.stringify({ completed: true }), headers: { "Content-Type": "application/json" } })).status).toBe(404);
    expect((await request(`/api/stars/${star.id}`, { method: "DELETE" })).status).toBe(404);
    expect((await (await request(`/api/blueshifts/${secondBlueshift}/stars`)).json()).map((s: { title: string }) => s.title)).toContain("Still here");
  });

  test("deleting a Blueshift cascades to its Stars", async () => {
    const orphan = await request(`/api/blueshifts/${firstBlueshift}/stars`, { method: "POST", body: JSON.stringify({ title: "Cascade me" }), headers: { "Content-Type": "application/json" } });
    expect(orphan.status).toBe(201);
    expect((await request(`/api/blueshifts/${firstBlueshift}`, { method: "DELETE" })).status).toBe(204);
    expect((await request(`/api/blueshifts/${firstBlueshift}/stars`)).status).toBe(404);
    expect((await request(`/api/blueshifts/${firstBlueshift}`)).status).toBe(404);
  });

  test("returns not-found when listing Stars for an unknown Blueshift", async () => {
    const response = await request(`/api/blueshifts/${crypto.randomUUID()}/stars`);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Blueshift not found" });
  });

  test("returns kind-prefixed errors for unknown Star member routes", async () => {
    const patch = await request(`/api/blueshifts/stars/${crypto.randomUUID()}`, { method: "PATCH", body: JSON.stringify({ completed: true }), headers: { "Content-Type": "application/json" } });
    expect(patch.status).toBe(404);
    expect(await patch.json()).toEqual({ error: "Blueshift star not found" });
    const del = await request(`/api/blueshifts/stars/${crypto.randomUUID()}`, { method: "DELETE" });
    expect(del.status).toBe(404);
    expect(await del.json()).toEqual({ error: "Blueshift star not found" });
  });

  test("serves North Stars under their own route and does not list them under a Stars collection route", async () => {
    const northStars = await request("/api/north-stars");
    expect(northStars.status).toBe(200);
    expect(await northStars.json()).toEqual(expect.any(Array));
    expect((await request("/api/blueshifts/stars")).status).toBe(404);
  });

  test("keeps Stars created within the same millisecond in insertion order", async () => {
    const created = await request("/api/blueshifts", { method: "POST", body: JSON.stringify({ name: "Ordered" }), headers: { "Content-Type": "application/json" } });
    const { id } = await created.json();
    const at = 1_700_000_000_000;
    await storage.db.insert(blueshiftStars).values([
      { id: crypto.randomUUID(), blueshiftId: id, title: "First", completedAt: null, northStar: false, createdAt: at },
      { id: crypto.randomUUID(), blueshiftId: id, title: "Second", completedAt: null, northStar: false, createdAt: at },
    ]);
    const response = await request(`/api/blueshifts/${id}/stars`);
    expect(response.status).toBe(200);
    expect((await response.json()).map((star: { title: string }) => star.title)).toEqual(["First", "Second"]);
  });
});

describe("redshift API", () => {
  let firstRedshift = "";
  let secondRedshift = "";

  beforeAll(async () => {
    firstRedshift = (await (await request("/api/redshifts", { method: "POST", body: JSON.stringify({ name: "Techno", goal: "Make noise" }), headers: { "Content-Type": "application/json" } })).json()).id;
    secondRedshift = (await (await request("/api/redshifts", { method: "POST", body: JSON.stringify({ name: "Strength" }), headers: { "Content-Type": "application/json" } })).json()).id;
  });

  test("creates Redshifts with an optional aim and lists them in creation order", async () => {
    const redshifts = await (await request("/api/redshifts")).json();
    expect(redshifts.map((item: { name: string }) => item.name)).toEqual(["Techno", "Strength"]);
    expect(redshifts[0].goal).toBe("Make noise");
    expect(redshifts[1].goal).toBeNull();
  });

  test("creates Stars without any North Star representation", async () => {
    const create = await request(`/api/redshifts/${firstRedshift}/stars`, { method: "POST", body: JSON.stringify({ title: "Free jam" }), headers: { "Content-Type": "application/json" } });
    expect(create.status).toBe(201);
    const star = await create.json();
    expect(star).toMatchObject({ redshiftId: firstRedshift, title: "Free jam", completedAt: null });
    expect("northStar" in star).toBe(false);
    expect((await (await request(`/api/redshifts/${firstRedshift}/stars`)).json()).map((s: { title: string }) => s.title)).toEqual(["Free jam"]);
  });

  test("stamps completedAt on tick, updates it on a same-day retick, and nulls it on untick", async () => {
    const create = await request(`/api/redshifts/${firstRedshift}/stars`, { method: "POST", body: JSON.stringify({ title: "Clock me" }), headers: { "Content-Type": "application/json" } });
    const star = await create.json();
    expect(star.completedAt).toBeNull();
    const ticked = await (await request(`/api/redshifts/stars/${star.id}`, { method: "PATCH", body: JSON.stringify({ completed: true }), headers: { "Content-Type": "application/json" } })).json();
    expect(ticked.completedAt).toBeNumber();
    const reticked = await (await request(`/api/redshifts/stars/${star.id}`, { method: "PATCH", body: JSON.stringify({ completed: true }), headers: { "Content-Type": "application/json" } })).json();
    expect(reticked.completedAt).toBeNumber();
    expect(reticked.completedAt).toBeGreaterThanOrEqual(ticked.completedAt);
    const unticked = await (await request(`/api/redshifts/stars/${star.id}`, { method: "PATCH", body: JSON.stringify({ completed: false }), headers: { "Content-Type": "application/json" } })).json();
    expect(unticked.completedAt).toBeNull();
  });

  test("accepts a completed-only patch and rejects a northStar patch", async () => {
    const create = await request(`/api/redshifts/${firstRedshift}/stars`, { method: "POST", body: JSON.stringify({ title: "Patch me" }), headers: { "Content-Type": "application/json" } });
    const { id } = await create.json();
    const completed = await request(`/api/redshifts/stars/${id}`, { method: "PATCH", body: JSON.stringify({ completed: true }), headers: { "Content-Type": "application/json" } });
    expect(completed.status).toBe(200);
    const northStar = await request(`/api/redshifts/stars/${id}`, { method: "PATCH", body: JSON.stringify({ northStar: true }), headers: { "Content-Type": "application/json" } });
    expect(northStar.status).toBe(400);
  });

  test("returns not-found when listing Stars for an unknown Redshift", async () => {
    const response = await request(`/api/redshifts/${crypto.randomUUID()}/stars`);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Redshift not found" });
  });

  test("returns kind-prefixed errors for unknown Star member routes", async () => {
    const patch = await request(`/api/redshifts/stars/${crypto.randomUUID()}`, { method: "PATCH", body: JSON.stringify({ completed: true }), headers: { "Content-Type": "application/json" } });
    expect(patch.status).toBe(404);
    expect(await patch.json()).toEqual({ error: "Redshift star not found" });
    const del = await request(`/api/redshifts/stars/${crypto.randomUUID()}`, { method: "DELETE" });
    expect(del.status).toBe(404);
    expect(await del.json()).toEqual({ error: "Redshift star not found" });
  });

  test("deleting a Redshift cascades to its Stars", async () => {
    const created = await request("/api/redshifts", { method: "POST", body: JSON.stringify({ name: "Cascading" }), headers: { "Content-Type": "application/json" } });
    const { id } = await created.json();
    const star = await request(`/api/redshifts/${id}/stars`, { method: "POST", body: JSON.stringify({ title: "Cascade me" }), headers: { "Content-Type": "application/json" } });
    const { id: starId } = await star.json();
    expect(star.status).toBe(201);
    expect((await request(`/api/redshifts/${id}`, { method: "DELETE" })).status).toBe(204);
    expect((await request(`/api/redshifts/${id}/stars`)).status).toBe(404);
    expect((await request(`/api/redshifts/${id}`)).status).toBe(404);
    const orphaned = await request(`/api/redshifts/stars/${starId}`, { method: "PATCH", body: JSON.stringify({ completed: false }), headers: { "Content-Type": "application/json" } });
    expect(orphaned.status).toBe(404);
    expect(await orphaned.json()).toEqual({ error: "Redshift star not found" });
  });

  test("keeps Redshift Stars created within the same millisecond in insertion order", async () => {
    const created = await request("/api/redshifts", { method: "POST", body: JSON.stringify({ name: "Ordered" }), headers: { "Content-Type": "application/json" } });
    const { id } = await created.json();
    const at = 1_700_000_000_000;
    await storage.db.insert(redshiftStars).values([
      { id: crypto.randomUUID(), redshiftId: id, title: "First", completedAt: null, createdAt: at },
      { id: crypto.randomUUID(), redshiftId: id, title: "Second", completedAt: null, createdAt: at },
    ]);
    const response = await request(`/api/redshifts/${id}/stars`);
    expect(response.status).toBe(200);
    expect((await response.json()).map((star: { title: string }) => star.title)).toEqual(["First", "Second"]);
  });
});

describe("settings API", () => {
  test("lazily creates the singleton with a null timezone", async () => {
    const response = await request("/api/settings");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: 1, timezone: null });
  });

  test("persists an IANA timezone that a later GET returns", async () => {
    const patch = await request("/api/settings", { method: "PATCH", body: JSON.stringify({ timezone: "Pacific/Auckland" }), headers: { "Content-Type": "application/json" } });
    expect(patch.status).toBe(200);
    expect(await patch.json()).toEqual({ id: 1, timezone: "Pacific/Auckland" });
    expect(await (await request("/api/settings")).json()).toEqual({ id: 1, timezone: "Pacific/Auckland" });
  });
});

afterAll(() => { storage.sqlite.close(); unlinkSync(path); });
