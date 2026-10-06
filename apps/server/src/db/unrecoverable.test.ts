import { describe, expect, test } from "bun:test";
import { LibsqlError } from "@libsql/client";
import { DrizzleQueryError } from "drizzle-orm";
import { findUnrecoverableDbError } from "./unrecoverable";

const poisonedStreamMessage =
  'Hrana(Api("status=404 Not Found, body={\\"error\\":\\"stream not found: fbfbca50:12f5224\\"}"))';

describe("findUnrecoverableDbError", () => {
  test("finds the poisoned replica stream error through drizzle's cause chain", () => {
    const leaf = new LibsqlError(poisonedStreamMessage, "");
    const error = new DrizzleQueryError('insert into "blueshifts" ...', [], leaf);
    expect(findUnrecoverableDbError(error)?.message).toContain("stream not found: fbfbca50:12f5224");
  });

  test("walks arbitrarily deep cause chains", () => {
    const leaf = new Error(poisonedStreamMessage);
    const middle = new Error('Failed query: insert into "blueshifts" ...', { cause: leaf });
    expect(findUnrecoverableDbError(middle)).toBe(leaf);
  });

  test("returns null for ordinary database errors", () => {
    const constraint = new LibsqlError("UNIQUE constraint failed: blueshifts.id", "SQLITE_CONSTRAINT");
    expect(findUnrecoverableDbError(new DrizzleQueryError("insert ...", [], constraint))).toBeNull();
    expect(findUnrecoverableDbError(new Error("boom"))).toBeNull();
  });

  test("returns null for non-error values", () => {
    expect(findUnrecoverableDbError("stream not found")).toBeNull();
    expect(findUnrecoverableDbError(null)).toBeNull();
  });
});
