import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { z } from "zod";

const packageJsonSchema = z.object({
  scripts: z.record(z.string(), z.string().optional()),
});

const parsed = packageJsonSchema.safeParse(JSON.parse(readFileSync(join(import.meta.dir, "../package.json"), "utf8")));
if (!parsed.success) throw new Error(`unexpected package.json shape: ${parsed.error.message}`);

describe("drift guard: push-only shaping is retired (ADR 0009)", () => {
  test("no db:push script exists in @proj/server", () => {
    expect(parsed.data.scripts["db:push"]).toBeUndefined();
  });

  test("migration scripts are present", () => {
    expect(parsed.data.scripts["db:generate"]).toContain("drizzle-kit generate");
    expect(parsed.data.scripts["db:migrate"]).toContain("drizzle-kit migrate");
  });
});
