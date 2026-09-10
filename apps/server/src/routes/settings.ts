import { updateSettingsSchema } from "@proj/shared";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "#db";
import { settings } from "#db/schema";

const singletonId = 1;

export function createSettingsRoutes(database = db) {
  return new Hono()
    .get("/", async (c) => {
      const existing = database.select().from(settings).where(eq(settings.id, singletonId)).get();
      if (existing) return c.json(existing);
      const row = { id: singletonId, timezone: null };
      await database.insert(settings).values(row);
      return c.json(row);
    })
    .patch("/", zValidator("json", updateSettingsSchema), async (c) => {
      const input = c.req.valid("json");
      const existing = database.select().from(settings).where(eq(settings.id, singletonId)).get();
      if (!existing) {
        const row = { id: singletonId, timezone: input.timezone };
        await database.insert(settings).values(row);
        return c.json(row);
      }
      const [updated] = await database
        .update(settings)
        .set({ timezone: input.timezone })
        .where(eq(settings.id, singletonId))
        .returning();
      return c.json(updated);
    });
}
