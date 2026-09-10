import { afterAll, describe, expect, test } from "bun:test";
import { createHarness, jsonHeaders, parseJson as json, settingsSchema } from "./test-harness";

const { request, close } = createHarness();

afterAll(() => {
  close();
});

describe("health probe", () => {
  test("responds 200 with a JSON body at /health", async () => {
    const response = await request("/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});

describe("settings API", () => {
  test("lazily creates the singleton with a null timezone", async () => {
    const response = await request("/api/settings");
    expect(response.status).toBe(200);
    expect(await json(response, settingsSchema)).toEqual({ id: 1, timezone: null });
  });

  test("persists an IANA timezone that a later GET returns", async () => {
    const patch = await request("/api/settings", {
      method: "PATCH",
      body: JSON.stringify({ timezone: "Pacific/Auckland" }),
      headers: jsonHeaders,
    });
    expect(patch.status).toBe(200);
    expect(await json(patch, settingsSchema)).toEqual({ id: 1, timezone: "Pacific/Auckland" });
    expect(await json(await request("/api/settings"), settingsSchema)).toEqual({ id: 1, timezone: "Pacific/Auckland" });
  });
});
