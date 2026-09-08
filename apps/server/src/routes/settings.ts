import { updateSettingsSchema } from "@proj/shared";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import type { db as defaultDb } from "../db";
import { settings } from "../db/schema";

type Database = typeof defaultDb;

const singletonId = 1;

export function createSettingsRoutes(database: Database) {
  return new Hono()
    .get("/", async (c) => {
      const existing = await database.select().from(settings).where(eq(settings.id, singletonId)).get();
      if (existing) return c.json(existing);
      const row = { id: singletonId, timezone: null };
      await database.insert(settings).values(row);
      return c.json(row);
    })
    .patch("/", zValidator("json", updateSettingsSchema), async (c) => {
      const input = c.req.valid("json");
      const existing = await database.select().from(settings).where(eq(settings.id, singletonId)).get();
      if (!existing) {
        const row = { id: singletonId, timezone: input.timezone };
        await database.insert(settings).values(row);
        return c.json(row);
      }
      const [updated] = await database.update(settings).set({ timezone: input.timezone }).where(eq(settings.id, singletonId)).returning();
      return c.json(updated);
    });
}
