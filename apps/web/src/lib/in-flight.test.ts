import { describe, expect, test } from "bun:test";
import { createInFlightLock } from "./in-flight";

interface Deferred {
  readonly promise: Promise<void>;
  readonly settle: () => void;
  readonly fail: (error: Error) => void;
}

function deferred(): Deferred {
  let settle!: () => void;
  let fail!: (error: Error) => void;
  const promise = new Promise<void>((resolve, reject) => {
    settle = resolve;
    fail = reject;
  });
  return { promise, settle, fail };
}

describe("createInFlightLock", () => {
  test("drops the second run of the same key while the first is in flight", async () => {
    const lock = createInFlightLock();
    const gate = deferred();
    const first = lock.tryRun("create:blueshift", () => gate.promise);
    if (first === null) throw new Error("Expected the lock to admit the first run");
    expect(lock.tryRun("create:blueshift", () => Promise.resolve("duplicate"))).toBeNull();
    expect(lock.isInFlight("create:blueshift")).toBe(true);
    gate.settle();
    await first;
  });

  test("releases the key after the action settles successfully", async () => {
    const lock = createInFlightLock();
    const gate = deferred();
    const first = lock.tryRun("create:blueshift", () => gate.promise);
    if (first === null) throw new Error("Expected the lock to admit the first run");
    gate.settle();
    await first;
    expect(lock.isInFlight("create:blueshift")).toBe(false);
    const retry = lock.tryRun("create:blueshift", () => Promise.resolve("retry"));
    if (retry === null) throw new Error("Expected the lock to release after settling");
    expect(await retry).toBe("retry");
    expect(lock.isInFlight("create:blueshift")).toBe(false);
  });

  test("releases the key after the action fails", async () => {
    const lock = createInFlightLock();
    const gate = deferred();
    const first = lock.tryRun("create:blueshift", () => gate.promise);
    if (first === null) throw new Error("Expected the lock to admit the first run");
    gate.fail(new Error("Boom"));
    const settled = await first.then(
      () => "settled" as const,
      () => "failed" as const,
    );
    expect(settled).toBe("failed");
    expect(lock.isInFlight("create:blueshift")).toBe(false);
    const retry = lock.tryRun("create:blueshift", () => Promise.resolve("retry"));
    if (retry === null) throw new Error("Expected the lock to release after failing");
    expect(await retry).toBe("retry");
  });

  test("independent keys never interfere", async () => {
    const lock = createInFlightLock();
    const gate = deferred();
    const first = lock.tryRun("create:blueshift", () => gate.promise);
    if (first === null) throw new Error("Expected the lock to admit the first run");
    expect(lock.isInFlight("create:redshift")).toBe(false);
    const second = lock.tryRun("create:redshift", () => Promise.resolve("independent"));
    if (second === null) throw new Error("Expected an independent key not to be blocked");
    expect(await second).toBe("independent");
    gate.settle();
    await first;
  });
});
