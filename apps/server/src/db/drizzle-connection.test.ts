import { describe, expect, test } from "bun:test";
import { readDrizzleConnection } from "./drizzle-connection";
import { remoteEnv, remoteUrl } from "./test-fixtures";

const remote = remoteEnv;

describe("drizzle gate: migrations against production run only in CI (ADR 0010)", () => {
  test("push stays blocked against remote databases, even in CI (ADR 0009)", () => {
    expect(() => readDrizzleConnection({ ...remote, CI: "true" }, ["migrate", "push"])).toThrow(/push is blocked/u);
  });

  test("a remote DATABASE_URL without CI throws (laptop migration)", () => {
    expect(() => readDrizzleConnection({ ...remote }, ["migrate"])).toThrow(/only in CI/u);
  });

  test("CI=false is not a CI context", () => {
    expect(() => readDrizzleConnection({ ...remote, CI: "false" }, ["migrate"])).toThrow(/only in CI/u);
  });

  test("CI migrates production with url, token, and turso dialect", () => {
    const connection = readDrizzleConnection({ ...remote, CI: "true" }, ["migrate"]);
    expect(connection).toEqual({ url: remoteUrl, authToken: "test-token", isRemote: true });
  });

  test("CI without DATABASE_AUTH_TOKEN throws", () => {
    expect(() => readDrizzleConnection({ ...remote, CI: "true", DATABASE_AUTH_TOKEN: "" }, ["migrate"])).toThrow(
      /DATABASE_AUTH_TOKEN is required/u,
    );
  });

  test("a local file URL needs no CI marker (tests migrate temporary file databases)", () => {
    const connection = readDrizzleConnection({ DATABASE_URL: "/tmp/polaris-test.sqlite" }, ["migrate"]);
    expect(connection).toEqual({ url: "/tmp/polaris-test.sqlite", authToken: "", isRemote: false });
  });

  test("no DATABASE_URL falls back to the local file database", () => {
    expect(readDrizzleConnection({}, [])).toEqual({ url: "sqlite.db", authToken: "", isRemote: false });
  });

  test("https:// counts as remote", () => {
    expect(() =>
      readDrizzleConnection({ DATABASE_URL: "https://example.com", DATABASE_AUTH_TOKEN: "t" }, ["migrate"]),
    ).toThrow(/only in CI/u);
  });

  test("wss:// counts as remote", () => {
    expect(() =>
      readDrizzleConnection({ DATABASE_URL: "wss://example.com", DATABASE_AUTH_TOKEN: "t" }, ["migrate"]),
    ).toThrow(/only in CI/u);
  });
});
