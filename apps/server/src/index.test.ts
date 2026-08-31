import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { unlinkSync } from "node:fs";
import { createDb } from "./db";
import { createApp } from "./index";

const path = `/tmp/starway-test-${crypto.randomUUID()}.sqlite`;
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
  });

  test("creates chronological Stars, toggles focus, and lists global North Stars", async () => {
    const create = await request(`/api/blueshifts/${firstBlueshift}/stars`, { method: "POST", body: JSON.stringify({ title: "Write outline" }), headers: { "Content-Type": "application/json" } });
    expect(create.status).toBe(201);
    firstStar = (await create.json()).id;
    const second = await request(`/api/blueshifts/${secondBlueshift}/stars`, { method: "POST", body: JSON.stringify({ title: "Read docs" }), headers: { "Content-Type": "application/json" } });
    const secondStar = (await second.json()).id;
    await request(`/api/stars/${firstStar}`, { method: "PATCH", body: JSON.stringify({ northStar: true }), headers: { "Content-Type": "application/json" } });
    await request(`/api/stars/${secondStar}`, { method: "PATCH", body: JSON.stringify({ northStar: true, completed: true }), headers: { "Content-Type": "application/json" } });
    const stars = await (await request("/api/north-stars")).json();
    expect(stars.map((star: { title: string }) => star.title)).toEqual(["Write outline", "Read docs"]);
    expect(stars[1].completed).toBe(true);
  });

  test("deleting a Blueshift cascades to its Stars", async () => {
    expect((await request(`/api/blueshifts/${firstBlueshift}`, { method: "DELETE" })).status).toBe(204);
    expect((await request(`/api/blueshifts/${firstBlueshift}/stars`)).json()).resolves.toEqual([]);
  });
});

afterAll(() => { storage.sqlite.close(); unlinkSync(path); });
