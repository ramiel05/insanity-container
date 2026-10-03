import { afterAll, describe, expect, test } from "bun:test";
import {
  createHarness,
  jsonHeaders,
  parseJson as json,
  redshiftSchema,
  redshiftStarSchema,
  type Redshift,
  type RedshiftStar,
} from "./test-harness";

const { request, close } = await createHarness();

afterAll(() => {
  close();
});

async function createRedshift(name: string): Promise<Redshift> {
  return json(
    await request("/api/redshifts", { method: "POST", body: JSON.stringify({ name }), headers: jsonHeaders }),
    redshiftSchema,
  );
}

async function createStar(redshiftId: string, title: string, fixed?: boolean): Promise<RedshiftStar> {
  const body = typeof fixed === "boolean" ? { title, fixed } : { title };
  return json(
    await request(`/api/redshifts/${redshiftId}/stars`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: jsonHeaders,
    }),
    redshiftStarSchema,
  );
}

describe("fixed stars", () => {
  test("creates Stars Fixed by default when fixed is omitted", async () => {
    const redshift = await createRedshift("Daily practice");
    const star = await createStar(redshift.id, "Stretch");
    expect(star.fixed).toBe(true);
    const response = await request(`/api/redshifts/${redshift.id}/stars`);
    const stars = await json(response, redshiftStarSchema.array());
    expect(stars.find((item) => item.id === star.id)?.fixed).toBe(true);
  });

  test("creates a non-Fixed Star when fixed is false", async () => {
    const redshift = await createRedshift("Once-off");
    const star = await createStar(redshift.id, "Buy the squat rack", false);
    expect(star.fixed).toBe(false);
    const response = await request(`/api/redshifts/${redshift.id}/stars`);
    const stars = await json(response, redshiftStarSchema.array());
    expect(stars.find((item) => item.id === star.id)?.fixed).toBe(false);
  });

  test("stamps completedAt on tick and nulls it on untick for a non-Fixed Star", async () => {
    const redshift = await createRedshift("Squat rack");
    const star = await createStar(redshift.id, "Buy the squat rack", false);
    const ticked = await json(
      await request(`/api/redshifts/stars/${star.id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: true }),
        headers: jsonHeaders,
      }),
      redshiftStarSchema,
    );
    expect(ticked.fixed).toBe(false);
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

  test("rejects patching a Star's Fixed-ness after creation", async () => {
    const redshift = await createRedshift("Pinned");
    const star = await createStar(redshift.id, "Fixed by default");
    const response = await request(`/api/redshifts/stars/${star.id}`, {
      method: "PATCH",
      body: JSON.stringify({ fixed: false }),
      headers: jsonHeaders,
    });
    expect(response.status).toBe(400);
    const combined = await request(`/api/redshifts/stars/${star.id}`, {
      method: "PATCH",
      body: JSON.stringify({ completed: true, fixed: false }),
      headers: jsonHeaders,
    });
    expect(combined.status).toBe(400);
  });
});
