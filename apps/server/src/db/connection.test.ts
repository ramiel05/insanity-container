import { describe, expect, test } from "bun:test";
import { connectionFromEnv } from "./connection";
import { remoteEnv, remoteUrl } from "./test-fixtures";

const remote = remoteEnv;

describe("connection policy: local dev and tests never touch a remote database (ADR 0008)", () => {
  test("production boots the embedded replica against the remote primary", () => {
    const connection = connectionFromEnv({ ...remote, NODE_ENV: "production" });
    expect(connection).toEqual({
      url: "file:replica.db",
      syncUrl: remote.DATABASE_URL,
      authToken: "test-token",
    });
  });

  test("a remote DATABASE_URL without NODE_ENV=production throws (local dev wired to prod)", () => {
    expect(() => connectionFromEnv({ ...remote })).toThrow(/remote DATABASE_URL/u);
  });

  test("a remote DATABASE_URL under NODE_ENV=test throws (credential leaks into a test run)", () => {
    expect(() => connectionFromEnv({ ...remote, NODE_ENV: "test" })).toThrow(/remote DATABASE_URL/u);
  });

  test("a remote DATABASE_URL under NODE_ENV=development throws", () => {
    expect(() => connectionFromEnv({ ...remote, NODE_ENV: "development" })).toThrow(/remote DATABASE_URL/u);
  });

  test("production without DATABASE_AUTH_TOKEN throws", () => {
    expect(() => connectionFromEnv({ DATABASE_URL: remoteUrl, NODE_ENV: "production" })).toThrow(
      /DATABASE_AUTH_TOKEN is required/u,
    );
  });

  test("no DATABASE_URL falls back to the local file database", () => {
    expect(connectionFromEnv({})).toEqual({ url: "file:sqlite.db" });
  });

  test("a local file URL passes through unchanged", () => {
    expect(connectionFromEnv({ DATABASE_URL: "file:sqlite.db" })).toEqual({ url: "file:sqlite.db" });
  });

  test("an absolute path becomes a file URL", () => {
    expect(connectionFromEnv({ DATABASE_URL: "/tmp/polaris.sqlite" })).toEqual({ url: "file:///tmp/polaris.sqlite" });
  });
});
