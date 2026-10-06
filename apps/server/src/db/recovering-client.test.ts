import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { createClient, LibsqlError } from "@libsql/client";
import { createRecoveringClient } from "./recovering-client";

const poisonedStreamMessage =
  'Hrana(Api("status=404 Not Found, body={\\"error\\":\\"stream not found: fbfbca50:12f5224\\"}"))';

class FakeReplicaClient {
  public readonly failTimes: number;
  public readonly mode: "poison" | "constraint";
  public executeCalls = 0;
  public reconnectCalls = 0;
  public protocol = "fake";

  public constructor(failTimes: number, mode: "poison" | "constraint" = "poison") {
    this.failTimes = failTimes;
    this.mode = mode;
  }

  public execute(): Promise<string> {
    this.executeCalls += 1;
    if (this.mode === "constraint") {
      return Promise.reject(new LibsqlError("UNIQUE constraint failed: blueshifts.id", "SQLITE_CONSTRAINT"));
    }
    if (this.executeCalls <= this.failTimes) {
      return Promise.reject(new LibsqlError(poisonedStreamMessage, ""));
    }
    return Promise.resolve(`executed-${this.executeCalls}`);
  }

  public reconnect(): Promise<void> {
    this.reconnectCalls += 1;
    return Promise.resolve();
  }
}

describe("createRecoveringClient", () => {
  test("retries once through a reconnect when the replica's remote stream is lost", async () => {
    const fake = new FakeReplicaClient(1);
    const client = createRecoveringClient(fake);
    const result = await client.execute();
    expect(result).toBe("executed-2");
    expect(fake.executeCalls).toBe(2);
    expect(fake.reconnectCalls).toBe(1);
  });

  test("reconnects once for concurrent failures and retries each", async () => {
    const fake = new FakeReplicaClient(2);
    const client = createRecoveringClient(fake);
    const [first, second] = await Promise.all([client.execute(), client.execute()]);
    expect(first).toBe("executed-3");
    expect(second).toBe("executed-4");
    expect(fake.executeCalls).toBe(4);
    expect(fake.reconnectCalls).toBe(1);
  });

  test("does not retry ordinary database errors", async () => {
    const fake = new FakeReplicaClient(1, "constraint");
    const client = createRecoveringClient(fake);
    try {
      await client.execute();
      expect.unreachable();
    } catch (error) {
      expect(String(error)).toContain("UNIQUE constraint failed");
    }
    expect(fake.executeCalls).toBe(1);
    expect(fake.reconnectCalls).toBe(0);
  });

  test("gives up after one retry when the stream stays lost", async () => {
    const fake = new FakeReplicaClient(Number.POSITIVE_INFINITY);
    const client = createRecoveringClient(fake);
    try {
      await client.execute();
      expect.unreachable();
    } catch (error) {
      expect(String(error)).toContain("stream not found");
    }
    expect(fake.executeCalls).toBe(2);
    expect(fake.reconnectCalls).toBe(1);
  });

  test("passes non-intercepted members through untouched", () => {
    const fake = new FakeReplicaClient(0);
    const client = createRecoveringClient(fake);
    expect(client.protocol).toBe("fake");
    expect(typeof client.reconnect).toBe("function");
    expect(fake.reconnectCalls).toBe(0);
  });

  test("keeps a real client fully usable through the wrapper", async () => {
    const dir = mkdtempSync(join(tmpdir(), "recovering-client-"));
    const raw = createClient({ url: `file:${join(dir, "test.db")}` });
    const client = createRecoveringClient(raw);
    await client.execute("CREATE TABLE t (id INTEGER)");
    await client.execute("INSERT INTO t VALUES (1), (2)");
    const result = await client.execute("SELECT count(*) AS n FROM t");
    expect(Number(result.rows[0]?.n)).toBe(2);
    expect(() => {
      client.close();
    }).not.toThrow();
    rmSync(dir, { recursive: true, force: true });
  });
});
