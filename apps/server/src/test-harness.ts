import { unlinkSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { createDb } from "./db";
import { createApp } from "./index";

export const blueshiftSchema = z.object({
  id: z.string(),
  name: z.string(),
  goal: z.string().nullable(),
  createdAt: z.number(),
});

export const blueshiftStarSchema = z.object({
  id: z.string(),
  blueshiftId: z.string(),
  title: z.string(),
  completedAt: z.number().nullable(),
  northStar: z.boolean(),
  createdAt: z.number(),
});

export const redshiftSchema = z.object({
  id: z.string(),
  name: z.string(),
  goal: z.string().nullable(),
  createdAt: z.number(),
});

export const redshiftStarSchema = z.object({
  id: z.string(),
  redshiftId: z.string(),
  title: z.string(),
  completedAt: z.number().nullable(),
  createdAt: z.number(),
});

export const settingsSchema = z.object({
  id: z.number(),
  timezone: z.string().nullable(),
});

export const apiErrorSchema = z.object({ error: z.string() });

export type Blueshift = z.infer<typeof blueshiftSchema>;
export type BlueshiftStar = z.infer<typeof blueshiftStarSchema>;
export type Redshift = z.infer<typeof redshiftSchema>;
export type RedshiftStar = z.infer<typeof redshiftStarSchema>;
export type Settings = z.infer<typeof settingsSchema>;

export const jsonHeaders: HeadersInit = { "Content-Type": "application/json" };

export async function parseJson<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  const result = schema.safeParse(await response.json());
  if (!result.success) throw new Error(`unexpected response shape: ${result.error.message}`);
  return result.data;
}

export function createHarness(): {
  storage: ReturnType<typeof createDb>;
  request: (url: string, init?: RequestInit) => Promise<Response>;
  close: () => void;
} {
  const path = `/tmp/polaris-test-${crypto.randomUUID()}.sqlite`;
  const serverRoot = join(import.meta.dir, "..");
  const pushed = Bun.spawnSync(["bun", "run", "db:push"], {
    cwd: serverRoot,
    env: { ...process.env, DATABASE_URL: path },
    stdout: "pipe",
    stderr: "pipe",
  });
  if (pushed.exitCode !== 0) {
    throw new Error(`db:push failed:\n${new TextDecoder().decode(pushed.stderr)}`);
  }
  const storage = createDb(path);
  const app = createApp(storage.db);

  async function request(url: string, init?: RequestInit): Promise<Response> {
    const response = await app.fetch(new Request(`http://test${url}`, init));
    return response;
  }

  function close(): void {
    storage.sqlite.close();
    unlinkSync(path);
  }

  return { storage, request, close };
}
