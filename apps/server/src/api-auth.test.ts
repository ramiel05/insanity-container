import { afterAll, describe, expect, test } from "bun:test";
import { allowAll, rejectAll } from "./auth";
import { apiErrorSchema, createHarness, parseJson as json } from "./test-harness";

const rejected = await createHarness(rejectAll);
const allowed = await createHarness(allowAll);

afterAll(() => {
  rejected.close();
  allowed.close();
});

describe("API auth gate", () => {
  test("rejects an API request with 401 when the authenticator rejects", async () => {
    const response = await rejected.request("/api/blueshifts");
    expect(response.status).toBe(401);
    expect(await json(response, apiErrorSchema)).toEqual({ error: "Unauthorized" });
  });

  test("leaves the health endpoint unauthenticated", async () => {
    const response = await rejected.request("/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  test("serves API routes as usual when the authenticator passes", async () => {
    const response = await allowed.request("/api/blueshifts");
    expect(response.status).toBe(200);
  });
});
