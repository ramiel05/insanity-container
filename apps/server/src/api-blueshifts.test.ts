import { afterAll, describe, expect, test } from "bun:test";
import { blueshiftStars } from "./db/schema";
import {
  apiErrorSchema,
  blueshiftSchema,
  blueshiftStarSchema,
  createHarness,
  jsonHeaders,
  parseJson as json,
  type Blueshift,
  type BlueshiftStar,
} from "./test-harness";

const { request, storage, close } = await createHarness();

afterAll(() => {
  close();
});

async function createBlueshift(name: string, goal?: string): Promise<Blueshift> {
  return json(
    await request("/api/blueshifts", { method: "POST", body: JSON.stringify({ name, goal }), headers: jsonHeaders }),
    blueshiftSchema,
  );
}

async function createStar(blueshiftId: string, title: string): Promise<BlueshiftStar> {
  return json(
    await request(`/api/blueshifts/${blueshiftId}/stars`, {
      method: "POST",
      body: JSON.stringify({ title }),
      headers: jsonHeaders,
    }),
    blueshiftStarSchema,
  );
}

describe("blueshift API", () => {
  test("creates Blueshifts with an optional goal and lists them", async () => {
    const launch = await createBlueshift("Launch", "Ship it");
    const learn = await createBlueshift("Learn");
    expect(launch.goal).toBe("Ship it");
    expect(learn.goal).toBeNull();
    const response = await request("/api/blueshifts");
    expect(response.status).toBe(200);
    const list = await json(response, blueshiftSchema.array());
    expect(list.map((item) => item.name)).toEqual(["Launch", "Learn"]);
  });

  test("returns not-found for an unknown Blueshift", async () => {
    const response = await request(`/api/blueshifts/${crypto.randomUUID()}/stars`);
    expect(response.status).toBe(404);
    expect(await json(response, apiErrorSchema)).toEqual({ error: "Blueshift not found" });
  });

  test("deleting a Blueshift cascades to its Stars", async () => {
    const blueshift = await createBlueshift("Cascading");
    expect((await createStar(blueshift.id, "Cascade me")).id).toBeString();
    expect((await request(`/api/blueshifts/${blueshift.id}`, { method: "DELETE" })).status).toBe(204);
    expect((await request(`/api/blueshifts/${blueshift.id}/stars`)).status).toBe(404);
    expect((await request(`/api/blueshifts/${blueshift.id}`)).status).toBe(404);
  });
});

describe("blueshift magnitude", () => {
  test("defaults new Blueshifts to Fourth Magnitude and updates via PATCH", async () => {
    const blueshift = await createBlueshift("Dim start");
    expect(blueshift.magnitude).toBe(4);
    const promoted = await json(
      await request(`/api/blueshifts/${blueshift.id}`, {
        method: "PATCH",
        body: JSON.stringify({ magnitude: 1 }),
        headers: jsonHeaders,
      }),
      blueshiftSchema,
    );
    expect(promoted.magnitude).toBe(1);
  });

  test("updates name, goal, and magnitude in one PATCH", async () => {
    const blueshift = await createBlueshift("Rename me", "Old goal");
    const updated = await json(
      await request(`/api/blueshifts/${blueshift.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: "Renamed", goal: "New goal", magnitude: 2 }),
        headers: jsonHeaders,
      }),
      blueshiftSchema,
    );
    expect(updated.name).toBe("Renamed");
    expect(updated.goal).toBe("New goal");
    expect(updated.magnitude).toBe(2);
  });

  test("rejects magnitudes outside 1 to 4", async () => {
    const blueshift = await createBlueshift("Bounds");
    for (const magnitude of [0, 5]) {
      const response = await request(`/api/blueshifts/${blueshift.id}`, {
        method: "PATCH",
        body: JSON.stringify({ magnitude }),
        headers: jsonHeaders,
      });
      expect(response.status).toBe(400);
    }
  });

  test("returns not-found for an unknown Blueshift", async () => {
    const response = await request(`/api/blueshifts/${crypto.randomUUID()}`, {
      method: "PATCH",
      body: JSON.stringify({ magnitude: 1 }),
      headers: jsonHeaders,
    });
    expect(response.status).toBe(404);
    expect(await json(response, apiErrorSchema)).toEqual({ error: "Blueshift not found" });
  });
});

describe("blueshift stars", () => {
  test("lists Stars for a Blueshift in creation order", async () => {
    const blueshift = await createBlueshift("Ordered");
    await createStar(blueshift.id, "Write outline");
    const response = await request(`/api/blueshifts/${blueshift.id}/stars`);
    expect(response.status).toBe(200);
    const stars = await json(response, blueshiftStarSchema.array());
    expect(stars.map((star) => star.title)).toEqual(["Write outline"]);
  });

  test("stamps completedAt with the server clock on tick and nulls it on untick", async () => {
    const blueshift = await createBlueshift("Clock me");
    const star = await createStar(blueshift.id, "Clock me");
    expect(star.completedAt).toBeNull();
    const before = Date.now();
    const ticked = await json(
      await request(`/api/blueshifts/stars/${star.id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: true }),
        headers: jsonHeaders,
      }),
      blueshiftStarSchema,
    );
    expect(ticked.completedAt).toBeNumber();
    expect(ticked.completedAt).toBeGreaterThanOrEqual(before);
    expect(ticked.completedAt).toBeLessThanOrEqual(Date.now());
    const unticked = await json(
      await request(`/api/blueshifts/stars/${star.id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: false }),
        headers: jsonHeaders,
      }),
      blueshiftStarSchema,
    );
    expect(unticked.completedAt).toBeNull();
  });

  test("returns kind-prefixed errors for unknown Star member routes", async () => {
    const patch = await request(`/api/blueshifts/stars/${crypto.randomUUID()}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: true }),
      headers: jsonHeaders,
    });
    expect(patch.status).toBe(404);
    expect(await json(patch, apiErrorSchema)).toEqual({ error: "Blueshift star not found" });
    const del = await request(`/api/blueshifts/stars/${crypto.randomUUID()}`, { method: "DELETE" });
    expect(del.status).toBe(404);
    expect(await json(del, apiErrorSchema)).toEqual({ error: "Blueshift star not found" });
  });
});

describe("north stars", () => {
  test("toggles focus and lists global North Stars", async () => {
    const first = await createBlueshift("Focus one");
    const second = await createBlueshift("Focus two");
    const firstStar = await createStar(first.id, "Write outline");
    const secondStar = await createStar(second.id, "Read docs");
    const patch = (body: Readonly<Record<string, unknown>>): RequestInit => ({
      method: "PATCH",
      body: JSON.stringify(body),
      headers: jsonHeaders,
    });
    expect((await request(`/api/blueshifts/stars/${firstStar.id}`, patch({ northStar: true }))).status).toBe(200);
    expect(
      (await request(`/api/blueshifts/stars/${secondStar.id}`, patch({ northStar: true, completed: true }))).status,
    ).toBe(200);
    const stars = await json(await request("/api/north-stars"), blueshiftStarSchema.array());
    expect(stars.map((star) => star.title)).toEqual(["Write outline", "Read docs"]);
    expect(stars[1]?.completedAt).toBeNumber();
    expect((await request(`/api/blueshifts/stars/${firstStar.id}`, patch({ northStar: false }))).status).toBe(200);
    const remaining = await json(await request("/api/north-stars"), blueshiftStarSchema.array());
    expect(remaining.map((star) => star.title)).toEqual(["Read docs"]);
  });

  test("serves North Stars under their own route and does not list them under a Stars collection route", async () => {
    const northStars = await request("/api/north-stars");
    expect(northStars.status).toBe(200);
    expect(await northStars.json()).toEqual(expect.any(Array));
    expect((await request("/api/blueshifts/stars")).status).toBe(404);
  });

  test("deleting a Star returns 204", async () => {
    const blueshift = await createBlueshift("Deletable");
    const star = await createStar(blueshift.id, "Gone soon");
    expect((await request(`/api/blueshifts/stars/${star.id}`, { method: "DELETE" })).status).toBe(204);
  });
});

describe("star insertion order", () => {
  test("keeps Stars created within the same millisecond in insertion order", async () => {
    const blueshift = await createBlueshift("Ordered");
    const at = 1_700_000_000_000;
    await storage.db.insert(blueshiftStars).values([
      {
        id: crypto.randomUUID(),
        blueshiftId: blueshift.id,
        title: "First",
        completedAt: null,
        northStar: false,
        createdAt: at,
      },
      {
        id: crypto.randomUUID(),
        blueshiftId: blueshift.id,
        title: "Second",
        completedAt: null,
        northStar: false,
        createdAt: at,
      },
    ]);
    const response = await request(`/api/blueshifts/${blueshift.id}/stars`);
    expect(response.status).toBe(200);
    const stars = await json(response, blueshiftStarSchema.array());
    expect(stars.map((star) => star.title)).toEqual(["First", "Second"]);
  });
});
