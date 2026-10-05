import { afterAll, describe, expect, test } from "bun:test";
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

const { request, close } = await createHarness();

afterAll(() => {
  close();
});

async function createBlueshift(name: string): Promise<Blueshift> {
  return json(
    await request("/api/blueshifts", { method: "POST", body: JSON.stringify({ name }), headers: jsonHeaders }),
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

const patch = (body: Readonly<Record<string, unknown>>): RequestInit => ({
  method: "PATCH",
  body: JSON.stringify(body),
  headers: jsonHeaders,
});

describe("blackholes", () => {
  test("collapses an incomplete Star and the flag rides the star PATCH", async () => {
    const blueshift = await createBlueshift("Enlarge");
    const star = await createStar(blueshift.id, "Swallow the sky");
    const collapsed = await json(
      await request(`/api/blueshifts/stars/${star.id}`, patch({ blackhole: true })),
      blueshiftStarSchema,
    );
    expect(collapsed.blackhole).toBe(true);
    expect(collapsed.completedAt).toBeNull();
    const lifted = await json(
      await request(`/api/blueshifts/stars/${star.id}`, patch({ blackhole: false })),
      blueshiftStarSchema,
    );
    expect(lifted.blackhole).toBe(false);
  });

  test("rejects a second active collapse with a Blueshift-prefixed error", async () => {
    const blueshift = await createBlueshift("Single eyed");
    const first = await createStar(blueshift.id, "First collapse");
    const second = await createStar(blueshift.id, "Second collapse");
    expect((await request(`/api/blueshifts/stars/${first.id}`, patch({ blackhole: true }))).status).toBe(200);
    const clash = await request(`/api/blueshifts/stars/${second.id}`, patch({ blackhole: true }));
    expect(clash.status).toBe(409);
    expect(await json(clash, apiErrorSchema)).toEqual({
      error: "Blueshift star cannot collapse: a Blackhole already exists",
    });
    expect((await request(`/api/blueshifts/stars/${second.id}`, patch({ blackhole: false }))).status).toBe(200);
    expect((await request(`/api/blueshifts/stars/${first.id}`, patch({ blackhole: false }))).status).toBe(200);
    expect((await request(`/api/blueshifts/stars/${second.id}`, patch({ blackhole: true }))).status).toBe(200);
    expect((await request(`/api/blueshifts/stars/${second.id}`, patch({ blackhole: false }))).status).toBe(200);
  });

  test("re-collapsing the Star that already carries the designation is idempotent", async () => {
    const blueshift = await createBlueshift("Self echo");
    const star = await createStar(blueshift.id, "Collapse twice");
    expect((await request(`/api/blueshifts/stars/${star.id}`, patch({ blackhole: true }))).status).toBe(200);
    const again = await request(`/api/blueshifts/stars/${star.id}`, patch({ blackhole: true }));
    expect(again.status).toBe(200);
    expect((await json(again, blueshiftStarSchema)).blackhole).toBe(true);
    expect((await request(`/api/blueshifts/stars/${star.id}`, patch({ blackhole: false }))).status).toBe(200);
  });

  test("ticking the Blackhole complete clears the designation in the same update", async () => {
    const blueshift = await createBlueshift("Completion clears");
    const star = await createStar(blueshift.id, "Finish me");
    expect((await request(`/api/blueshifts/stars/${star.id}`, patch({ blackhole: true }))).status).toBe(200);
    const ticked = await json(
      await request(`/api/blueshifts/stars/${star.id}`, patch({ completed: true })),
      blueshiftStarSchema,
    );
    expect(ticked.blackhole).toBe(false);
    expect(ticked.completedAt).toBeNumber();
    const next = await createStar(blueshift.id, "Collapse again");
    expect((await request(`/api/blueshifts/stars/${next.id}`, patch({ blackhole: true }))).status).toBe(200);
    expect((await request(`/api/blueshifts/stars/${next.id}`, patch({ blackhole: false }))).status).toBe(200);
    expect((await request(`/api/blueshifts/stars/${star.id}`, patch({ completed: false }))).status).toBe(200);
  });
});
