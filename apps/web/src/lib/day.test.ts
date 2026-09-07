import { describe, expect, test } from "bun:test";
import { isTickedToday } from "./day";

const aucklandNow = Date.UTC(2026, 2, 7, 21, 0);
const tickedThisMorningInAuckland = Date.UTC(2026, 2, 7, 19, 0);
const tickedYesterdayEveningInAuckland = Date.UTC(2026, 2, 7, 10, 0);
const justBeforeAucklandMidnight = Date.UTC(2026, 2, 7, 10, 59, 59);
const justAfterAucklandMidnight = Date.UTC(2026, 2, 7, 11, 0, 1);
const utcNoon = Date.UTC(2026, 2, 7, 12, 0);
const utcMidMorning = Date.UTC(2026, 2, 7, 11, 30);
const aucklandNextMidnight = Date.UTC(2026, 2, 8, 11, 30);

describe("isTickedToday", () => {
  test("returns false for a null completion", () => {
    expect(isTickedToday(null, aucklandNow, "Pacific/Auckland")).toBe(false);
  });

  test("treats a tick from earlier the same day as ticked", () => {
    expect(isTickedToday(tickedThisMorningInAuckland, aucklandNow, "Pacific/Auckland")).toBe(true);
  });

  test("treats a tick from yesterday as un-ticked", () => {
    expect(isTickedToday(tickedYesterdayEveningInAuckland, aucklandNow, "Pacific/Auckland")).toBe(false);
  });

  test("resets at the start of the next day in the effective zone", () => {
    expect(isTickedToday(justBeforeAucklandMidnight, justBeforeAucklandMidnight, "Pacific/Auckland")).toBe(true);
    expect(isTickedToday(justBeforeAucklandMidnight, justAfterAucklandMidnight, "Pacific/Auckland")).toBe(false);
  });

  test("follows the zone it is given rather than the host zone", () => {
    expect(isTickedToday(utcMidMorning, utcNoon, "UTC")).toBe(true);
    expect(isTickedToday(utcMidMorning, aucklandNextMidnight, "Pacific/Auckland")).toBe(false);
  });
});
