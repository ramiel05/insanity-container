import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { unlinkSync } from "node:fs";
import { join } from "node:path";
import { createDb } from "./db";
import { blueshiftStars } from "./db/schema";
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
    expect((await request(`/api/stars/${firstStar}`, { method: "PATCH", body: JSON.stringify({ completed: true }), headers: { "Content-Type": "application/json" } })).status).toBe(404);
    expect((await request(`/api/stars/${firstStar}`, { method: "DELETE" })).status).toBe(404);
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

afterAll(() => { storage.sqlite.close(); unlinkSync(path); });
