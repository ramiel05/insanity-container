import { describe, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import {
  applyStarPatch,
  invalidate,
  latestError,
  patchListItems,
  removeStarEverywhere,
  restore,
  shiftStarsKey,
  snapshot,
} from "./workspace-cache";

type Row = { readonly id: string; readonly name?: string; readonly magnitude?: number };

const NOW = 1_700_000_000;

function client(): QueryClient {
  return new QueryClient();
}

function feed(c: QueryClient, key: readonly unknown[], rows: readonly unknown[]): void {
  c.setQueryData<unknown[]>(key, [...rows]);
}

const blueshiftListKey = ["lists", "blueshift"];
const redshiftListKey = ["lists", "redshift"];
const blueshiftStarsKey = ["stars", "blueshift", "b1"];
const redshiftStarsKey = ["stars", "redshift", "r1"];
const northStarsKey = ["north-stars"];
const blackholesKey = ["blackholes"];
const starsPrefixKey = ["stars"];

function blueshift(id: string): {
  id: string;
  name: string;
  goal: string | null;
  magnitude: number;
  createdAt: number;
} {
  return { id, name: `B ${id}`, goal: null, magnitude: 4, createdAt: 1 };
}
function redshift(id: string): { id: string; name: string; goal: string | null; magnitude: number; createdAt: number } {
  return { id, name: `R ${id}`, goal: null, magnitude: 4, createdAt: 1 };
}
function blueshiftStar(id: string): {
  id: string;
  title: string;
  completedAt: number | null;
  northStar: boolean;
  blackhole: boolean;
} {
  return { id, title: `S ${id}`, completedAt: null, northStar: false, blackhole: false };
}
function redshiftStar(id: string): { id: string; title: string; completedAt: number | null } {
  return { id, title: `T ${id}`, completedAt: null };
}

describe("patchListItems", () => {
  test("patches matching rows in every list under the key", () => {
    const c = client();
    feed(c, blueshiftListKey, [blueshift("b1"), blueshift("b2")]);
    patchListItems<Row>(c, blueshiftListKey, "b1", { name: "Renamed" });
    patchListItems<Row>(c, blueshiftListKey, "b1", { magnitude: 2 });
    expect(c.getQueryData<unknown[]>(blueshiftListKey)).toEqual([
      { ...blueshift("b1"), name: "Renamed", magnitude: 2 },
      blueshift("b2"),
    ]);
  });

  test("leaves lists under other keys untouched", () => {
    const c = client();
    feed(c, blueshiftListKey, [blueshift("b1")]);
    feed(c, redshiftListKey, [redshift("r1")]);
    patchListItems<Row>(c, redshiftListKey, "r1", { name: "R renamed" });
    expect(c.getQueryData<{ name: string }[]>(blueshiftListKey)?.[0]?.name).toBe("B b1");
    expect(c.getQueryData<{ name: string }[]>(redshiftListKey)?.[0]?.name).toBe("R renamed");
  });
});

describe("applyStarPatch (completed)", () => {
  test("stamps completedAt for a tick and nulls it for an untick", () => {
    const c = client();
    feed(c, blueshiftStarsKey, [blueshiftStar("s1")]);
    applyStarPatch(c, blueshiftStarsKey, "s1", { completed: true }, NOW);
    expect(c.getQueryData<{ completedAt: number | null }[]>(blueshiftStarsKey)?.[0]?.completedAt).toBe(NOW);

    applyStarPatch(c, blueshiftStarsKey, "s1", { completed: false }, NOW);
    expect(c.getQueryData<{ completedAt: number | null }[]>(blueshiftStarsKey)?.[0]?.completedAt).toBeNull();
  });

  test("does the same for redshift star rows", () => {
    const c = client();
    feed(c, redshiftStarsKey, [redshiftStar("s1")]);
    applyStarPatch(c, redshiftStarsKey, "s1", { completed: true }, NOW);
    expect(c.getQueryData<{ completedAt: number | null }[]>(redshiftStarsKey)?.[0]?.completedAt).toBe(NOW);

    applyStarPatch(c, redshiftStarsKey, "s1", { completed: false }, NOW);
    expect(c.getQueryData<{ completedAt: number | null }[]>(redshiftStarsKey)?.[0]?.completedAt).toBeNull();
  });
});

describe("applyStarPatch (northStar)", () => {
  test("adds a new North Star to the north-stars cache", () => {
    const c = client();
    feed(c, blueshiftStarsKey, [blueshiftStar("s1")]);
    feed(c, northStarsKey, [blueshiftStar("s0")]);
    applyStarPatch(c, blueshiftStarsKey, "s1", { northStar: true }, NOW);
    const north = c.getQueryData<{ id: string; northStar: boolean }[]>(northStarsKey);
    expect(north?.map((item) => item.id)).toEqual(["s0", "s1"]);
    expect(north?.[1]?.northStar).toBe(true);
  });

  test("removes an existing North Star from the north-stars cache", () => {
    const c = client();
    feed(c, blueshiftStarsKey, [blueshiftStar("s1")]);
    feed(c, northStarsKey, [
      { ...blueshiftStar("s0"), northStar: true },
      { ...blueshiftStar("s1"), northStar: true },
    ]);
    applyStarPatch(c, blueshiftStarsKey, "s1", { northStar: false }, NOW);
    const north = c.getQueryData<{ id: string }[]>(northStarsKey);
    expect(north?.map((item) => item.id)).toEqual(["s0"]);
  });

  test("completed-only patches leave the north-stars cache to the server refresh", () => {
    const c = client();
    feed(c, blueshiftStarsKey, [{ ...blueshiftStar("s1"), northStar: true, completedAt: null }]);
    feed(c, northStarsKey, [blueshiftStar("s1")]);
    applyStarPatch(c, blueshiftStarsKey, "s1", { completed: true }, NOW);
    expect(c.getQueryData<{ id: string; completedAt: number | null }[]>(northStarsKey)).toEqual([blueshiftStar("s1")]);
  });

  test("leaves the north-stars cache alone when it is not loaded", () => {
    const c = client();
    feed(c, blueshiftStarsKey, [blueshiftStar("s1")]);
    applyStarPatch(c, blueshiftStarsKey, "s1", { northStar: true }, NOW);
    expect(c.getQueryData<unknown[]>(northStarsKey)).toBeUndefined();
  });
});

describe("applyStarPatch (blackhole)", () => {
  test("adds the collapsing Star as the single blackhole entry", () => {
    const c = client();
    feed(c, blueshiftStarsKey, [blueshiftStar("s1")]);
    feed(c, blackholesKey, []);
    applyStarPatch(c, blueshiftStarsKey, "s1", { blackhole: true }, NOW);
    const holes = c.getQueryData<{ id: string; blackhole: boolean }[]>(blackholesKey);
    expect(holes?.map((item) => item.id)).toEqual(["s1"]);
    expect(holes?.[0]?.blackhole).toBe(true);
  });

  test("drops the Star from the blackholes cache on release", () => {
    const c = client();
    feed(c, blueshiftStarsKey, [{ ...blueshiftStar("s1"), blackhole: true }]);
    feed(c, blackholesKey, [{ ...blueshiftStar("s1"), blackhole: true }]);
    applyStarPatch(c, blueshiftStarsKey, "s1", { blackhole: false }, NOW);
    expect(c.getQueryData<{ id: string }[]>(blackholesKey)).toEqual([]);
  });

  test("completion clears the blackhole cache without touching the north-stars cache", () => {
    const c = client();
    feed(c, blueshiftStarsKey, [{ ...blueshiftStar("s1"), blackhole: true }]);
    feed(c, blackholesKey, [{ ...blueshiftStar("s1"), blackhole: true }]);
    applyStarPatch(c, blueshiftStarsKey, "s1", { completed: true }, NOW);
    expect(c.getQueryData<{ id: string }[]>(blackholesKey)).toEqual([]);
  });

  test("completion wins when collapse and tick ride one patch", () => {
    const c = client();
    feed(c, blueshiftStarsKey, [blueshiftStar("s1")]);
    feed(c, blackholesKey, [{ ...blueshiftStar("s0"), blackhole: true }]);
    applyStarPatch(c, blueshiftStarsKey, "s1", { completed: true, blackhole: true }, NOW);
    expect(c.getQueryData<unknown[]>(blackholesKey)).toEqual([{ ...blueshiftStar("s0"), blackhole: true }]);
  });

  test("leaves the blackholes cache alone when it is not loaded", () => {
    const c = client();
    feed(c, blueshiftStarsKey, [blueshiftStar("s1")]);
    applyStarPatch(c, blueshiftStarsKey, "s1", { blackhole: true }, NOW);
    expect(c.getQueryData<unknown[]>(blackholesKey)).toBeUndefined();
  });
});

describe("removeStarEverywhere", () => {
  test("drops the Star from shift lists, North Stars, and blackholes", () => {
    const c = client();
    feed(c, blueshiftStarsKey, [blueshiftStar("s1"), blueshiftStar("s2")]);
    feed(c, northStarsKey, [{ ...blueshiftStar("s1"), northStar: true }]);
    feed(c, blackholesKey, [{ ...blueshiftStar("s1"), blackhole: true }]);
    removeStarEverywhere(c, starsPrefixKey, "s1");
    expect(c.getQueryData<{ id: string }[]>(blueshiftStarsKey)?.map((item) => item.id)).toEqual(["s2"]);
    expect(c.getQueryData<unknown[]>(northStarsKey)).toEqual([]);
    expect(c.getQueryData<unknown[]>(blackholesKey)).toEqual([]);
  });

  test("leaves redshift star lists and unloaded keys alone", () => {
    const c = client();
    feed(c, redshiftStarsKey, [redshiftStar("t1")]);
    removeStarEverywhere(c, starsPrefixKey, "t1");
    expect(c.getQueryData<unknown[]>(redshiftStarsKey)).toEqual([]);
    expect(c.getQueryData<unknown[]>(northStarsKey)).toBeUndefined();
    expect(c.getQueryData<unknown[]>(blackholesKey)).toBeUndefined();
  });
});

describe("latestError", () => {
  const view = (submittedAt: number): { readonly submittedAt: number } => ({ submittedAt });

  test("returns the message of the latest failed op", () => {
    const a = { ...view(10), error: new Error("a") };
    const b = { ...view(20), error: new Error("b") };
    expect(latestError([a, b])).toBe("b");
  });

  test("ignores successes and returns undefined with no failures", () => {
    const failed = { ...view(10), error: new Error("a") };
    const ok = { ...view(30), error: null };
    expect(latestError([ok, failed])).toBe("a");
    expect(latestError([ok])).toBeUndefined();
  });
});

describe("shiftStarsKey", () => {
  test("scopes a Stars key to one kind and shift", () => {
    expect(shiftStarsKey("blueshift", "b1")).toEqual(["stars", "blueshift", "b1"]);
    expect(shiftStarsKey("redshift", "r1")).toEqual(["stars", "redshift", "r1"]);
  });

  test("stays under its kind's stars prefix", () => {
    const c = client();
    feed(c, shiftStarsKey("blueshift", "b1"), [blueshiftStar("s1")]);
    expect(c.getQueriesData({ queryKey: ["stars", "blueshift"] })).toHaveLength(1);
    expect(c.getQueriesData({ queryKey: ["stars", "redshift"] })).toHaveLength(0);
  });
});

describe("invalidate", () => {
  test("marks each listed key stale and leaves unlisted keys alone", () => {
    const c = client();
    feed(c, blueshiftListKey, [blueshift("b1")]);
    feed(c, redshiftListKey, [redshift("r1")]);
    feed(c, northStarsKey, []);

    invalidate(c, [blueshiftListKey, northStarsKey]);

    expect(c.getQueryState(blueshiftListKey)?.isInvalidated).toBe(true);
    expect(c.getQueryState(northStarsKey)?.isInvalidated).toBe(true);
    expect(c.getQueryState(redshiftListKey)?.isInvalidated).toBe(false);
  });
});

describe("snapshot/restore", () => {
  test("snapshot captures every list under the key and restore reverts it", () => {
    const c = client();
    feed(c, blueshiftListKey, [blueshift("b1")]);
    feed(c, ["lists", "blueshift", "detail"], [blueshift("b9")]);

    const taken = snapshot(c, ["lists", "blueshift"]);
    expect(taken).toHaveLength(2);

    patchListItems<Row>(c, blueshiftListKey, "b1", { name: "Renamed" });
    feed(c, ["lists", "blueshift", "detail"], []);
    restore(c, taken);

    expect(c.getQueryData<unknown[]>(blueshiftListKey)).toEqual([blueshift("b1")]);
    expect(c.getQueryData<unknown[]>(["lists", "blueshift", "detail"])).toEqual([blueshift("b9")]);
  });

  test("restore leaves lists outside the snapshot alone", () => {
    const c = client();
    feed(c, blueshiftListKey, [blueshift("b1")]);
    feed(c, redshiftListKey, [redshift("r1")]);

    const taken = snapshot(c, ["lists", "blueshift"]);
    patchListItems<Row>(c, redshiftListKey, "r1", { name: "R renamed" });
    restore(c, taken);

    expect(c.getQueryData<{ name: string }[]>(redshiftListKey)?.[0]?.name).toBe("R renamed");
  });
});
