import { afterAll, describe, expect, test } from "bun:test";
import { redshiftStars } from "./db/schema";
import {
  apiErrorSchema,
  createHarness,
  jsonHeaders,
  parseJson as json,
  redshiftSchema,
  redshiftStarSchema,
  type Redshift,
  type RedshiftStar,
} from "./test-harness";

const { request, storage, close } = createHarness();

afterAll(() => {
  close();
});

async function createRedshift(name: string, goal?: string): Promise<Redshift> {
  return json(
    await request("/api/redshifts", { method: "POST", body: JSON.stringify({ name, goal }), headers: jsonHeaders }),
    redshiftSchema,
  );
}

async function createStar(redshiftId: string, title: string): Promise<RedshiftStar> {
  return json(
    await request(`/api/redshifts/${redshiftId}/stars`, {
      method: "POST",
      body: JSON.stringify({ title }),
      headers: jsonHeaders,
    }),
    redshiftStarSchema,
  );
}

describe("redshift API", () => {
  test("creates Redshifts with an optional aim and lists them in creation order", async () => {
    const techno = await createRedshift("Techno", "Make noise");
    const strength = await createRedshift("Strength");
    expect(techno.goal).toBe("Make noise");
    expect(strength.goal).toBeNull();
    const response = await request("/api/redshifts");
    expect(response.status).toBe(200);
    const list = await json(response, redshiftSchema.array());
    expect(list.map((item) => item.name)).toEqual(["Techno", "Strength"]);
    expect(list[0]?.goal).toBe("Make noise");
    expect(list[1]?.goal).toBeNull();
  });

  test("returns not-found when listing Stars for an unknown Redshift", async () => {
    const response = await request(`/api/redshifts/${crypto.randomUUID()}/stars`);
    expect(response.status).toBe(404);
    expect(await json(response, apiErrorSchema)).toEqual({ error: "Redshift not found" });
  });

  test("deleting a Redshift cascades to its Stars", async () => {
    const redshift = await createRedshift("Cascading");
    const star = await createStar(redshift.id, "Cascade me");
    expect((await request(`/api/redshifts/${redshift.id}`, { method: "DELETE" })).status).toBe(204);
    expect((await request(`/api/redshifts/${redshift.id}/stars`)).status).toBe(404);
    expect((await request(`/api/redshifts/${redshift.id}`)).status).toBe(404);
    const orphaned = await request(`/api/redshifts/stars/${star.id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: false }),
      headers: jsonHeaders,
    });
    expect(orphaned.status).toBe(404);
    expect(await json(orphaned, apiErrorSchema)).toEqual({ error: "Redshift star not found" });
  });
});

describe("redshift magnitude", () => {
  test("defaults new Redshifts to Fourth Magnitude and updates via PATCH", async () => {
    const redshift = await createRedshift("Dim start");
    expect(redshift.magnitude).toBe(4);
    const promoted = await json(
      await request(`/api/redshifts/${redshift.id}`, {
        method: "PATCH",
        body: JSON.stringify({ magnitude: 1 }),
        headers: jsonHeaders,
      }),
      redshiftSchema,
    );
    expect(promoted.magnitude).toBe(1);
  });

  test("updates name, goal, and magnitude in one PATCH", async () => {
    const redshift = await createRedshift("Rename me", "Old aim");
    const updated = await json(
      await request(`/api/redshifts/${redshift.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: "Renamed", goal: "New aim", magnitude: 3 }),
        headers: jsonHeaders,
      }),
      redshiftSchema,
    );
    expect(updated.name).toBe("Renamed");
    expect(updated.goal).toBe("New aim");
    expect(updated.magnitude).toBe(3);
  });

  test("rejects magnitudes outside 1 to 4", async () => {
    const redshift = await createRedshift("Bounds");
    for (const magnitude of [0, 5]) {
      const response = await request(`/api/redshifts/${redshift.id}`, {
        method: "PATCH",
        body: JSON.stringify({ magnitude }),
        headers: jsonHeaders,
      });
      expect(response.status).toBe(400);
    }
  });

  test("returns not-found for an unknown Redshift", async () => {
    const response = await request(`/api/redshifts/${crypto.randomUUID()}`, {
      method: "PATCH",
      body: JSON.stringify({ magnitude: 1 }),
      headers: jsonHeaders,
    });
    expect(response.status).toBe(404);
    expect(await json(response, apiErrorSchema)).toEqual({ error: "Redshift not found" });
  });
});

describe("redshift stars", () => {
  test("creates Stars without any North Star representation", async () => {
    const redshift = await createRedshift("Jamming");
    const star = await createStar(redshift.id, "Free jam");
    expect(star).toMatchObject({ redshiftId: redshift.id, title: "Free jam", completedAt: null });
    expect("northStar" in star).toBe(false);
    const response = await request(`/api/redshifts/${redshift.id}/stars`);
    const stars = await json(response, redshiftStarSchema.array());
    expect(stars.map((item) => item.title)).toEqual(["Free jam"]);
  });
});

describe("redshift star clock", () => {
  test("stamps completedAt on tick and nulls it on untick", async () => {
    const redshift = await createRedshift("Clock me");
    const star = await createStar(redshift.id, "Clock me");
    expect(star.completedAt).toBeNull();
    const ticked = await json(
      await request(`/api/redshifts/stars/${star.id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: true }),
        headers: jsonHeaders,
      }),
      redshiftStarSchema,
    );
    expect(ticked.completedAt).toBeNumber();
    const unticked = await json(
      await request(`/api/redshifts/stars/${star.id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: false }),
        headers: jsonHeaders,
      }),
      redshiftStarSchema,
    );
    expect(unticked.completedAt).toBeNull();
  });
});

describe("redshift star retick", () => {
  test("updates completedAt on a same-day retick", async () => {
    const redshift = await createRedshift("Clock me");
    const star = await createStar(redshift.id, "Clock me");
    const tick = async (): Promise<RedshiftStar> =>
      json(
        await request(`/api/redshifts/stars/${star.id}`, {
          method: "PATCH",
          body: JSON.stringify({ completed: true }),
          headers: jsonHeaders,
        }),
        redshiftStarSchema,
      );
    const ticked = await tick();
    const reticked = await tick();
    expect(reticked.completedAt).toBeNumber();
    expect(reticked.completedAt).toBeGreaterThanOrEqual(ticked.completedAt ?? 0);
  });
});

describe("redshift star patching", () => {
  test("accepts a completed-only patch and rejects a northStar patch", async () => {
    const redshift = await createRedshift("Patch me");
    const star = await createStar(redshift.id, "Patch me");
    const completed = await request(`/api/redshifts/stars/${star.id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: true }),
      headers: jsonHeaders,
    });
    expect(completed.status).toBe(200);
    const northStar = await request(`/api/redshifts/stars/${star.id}`, {
      method: "PATCH",
      body: JSON.stringify({ northStar: true }),
      headers: jsonHeaders,
    });
    expect(northStar.status).toBe(400);
  });

  test("returns kind-prefixed errors for unknown Star member routes", async () => {
    const patch = await request(`/api/redshifts/stars/${crypto.randomUUID()}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: true }),
      headers: jsonHeaders,
    });
    expect(patch.status).toBe(404);
    expect(await json(patch, apiErrorSchema)).toEqual({ error: "Redshift star not found" });
    const del = await request(`/api/redshifts/stars/${crypto.randomUUID()}`, { method: "DELETE" });
    expect(del.status).toBe(404);
    expect(await json(del, apiErrorSchema)).toEqual({ error: "Redshift star not found" });
  });
});

describe("redshift star insertion order", () => {
  test("keeps Redshift Stars created within the same millisecond in insertion order", async () => {
    const redshift = await createRedshift("Ordered");
    const at = 1_700_000_000_000;
    await storage.db.insert(redshiftStars).values([
      { id: crypto.randomUUID(), redshiftId: redshift.id, title: "First", completedAt: null, createdAt: at },
      { id: crypto.randomUUID(), redshiftId: redshift.id, title: "Second", completedAt: null, createdAt: at },
    ]);
    const response = await request(`/api/redshifts/${redshift.id}/stars`);
    expect(response.status).toBe(200);
    const stars = await json(response, redshiftStarSchema.array());
    expect(stars.map((star) => star.title)).toEqual(["First", "Second"]);
  });
});
