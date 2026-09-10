import {
  createRedshiftSchema,
  createRedshiftStarSchema,
  updateRedshiftSchema,
  updateRedshiftStarSchema,
} from "@proj/shared";
import { zValidator } from "@hono/zod-validator";
import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "#db";
import { redshifts, redshiftStars } from "#db/schema";

export function createRedshiftRoutes(database = db) {
  return new Hono()
    .get("/", async (c) =>
      c.json(
        await database
          .select()
          .from(redshifts)
          .orderBy(redshifts.createdAt, sql`rowid`),
      ),
    )
    .post("/", zValidator("json", createRedshiftSchema), async (c) => {
      const input = c.req.valid("json");
      const [created] = await database
        .insert(redshifts)
        .values({ id: crypto.randomUUID(), name: input.name, goal: input.goal ?? null, createdAt: Date.now() })
        .returning();
      return c.json(created, 201);
    })
    .patch("/:id", zValidator("json", updateRedshiftSchema), async (c) => {
      const input = c.req.valid("json");
      const set: Partial<typeof redshifts.$inferInsert> = {};
      if ("name" in input) set.name = input.name;
      if ("goal" in input) set.goal = input.goal ?? null;
      if ("magnitude" in input) set.magnitude = input.magnitude;
      const [updated] = await database
        .update(redshifts)
        .set(set)
        .where(eq(redshifts.id, c.req.param("id")))
        .returning();
      if (!updated) return c.json({ error: "Redshift not found" }, 404);
      return c.json(updated);
    })
    .delete("/:id", async (c) => {
      const [deleted] = await database
        .delete(redshifts)
        .where(eq(redshifts.id, c.req.param("id")))
        .returning();
      if (!deleted) return c.json({ error: "Redshift not found" }, 404);
      return c.body(null, 204);
    });
}

export function createRedshiftNestedStarRoutes(database = db) {
  return new Hono()
    .get("/:id/stars", async (c) => {
      const [redshift] = await database
        .select()
        .from(redshifts)
        .where(eq(redshifts.id, c.req.param("id")));
      if (!redshift) return c.json({ error: "Redshift not found" }, 404);
      return c.json(
        await database
          .select()
          .from(redshiftStars)
          .where(eq(redshiftStars.redshiftId, c.req.param("id")))
          .orderBy(redshiftStars.createdAt, sql`rowid`),
      );
    })
    .post("/:id/stars", zValidator("json", createRedshiftStarSchema), async (c) => {
      const [redshift] = await database
        .select()
        .from(redshifts)
        .where(eq(redshifts.id, c.req.param("id")));
      if (!redshift) return c.json({ error: "Redshift not found" }, 404);
      const input = c.req.valid("json");
      const star = {
        id: crypto.randomUUID(),
        redshiftId: redshift.id,
        title: input.title,
        completedAt: null,
        createdAt: Date.now(),
      };
      await database.insert(redshiftStars).values(star);
      return c.json(star, 201);
    });
}

export function createRedshiftStarRoutes(database = db) {
  return new Hono()
    .patch("/:id", zValidator("json", updateRedshiftStarSchema), async (c) => {
      const input = c.req.valid("json");
      const [star] = await database
        .update(redshiftStars)
        .set({ completedAt: input.completed ? Date.now() : null })
        .where(eq(redshiftStars.id, c.req.param("id")))
        .returning();
      if (!star) return c.json({ error: "Redshift star not found" }, 404);
      return c.json(star);
    })
    .delete("/:id", async (c) => {
      const [deleted] = await database
        .delete(redshiftStars)
        .where(eq(redshiftStars.id, c.req.param("id")))
        .returning();
      if (!deleted) return c.json({ error: "Redshift star not found" }, 404);
      return c.body(null, 204);
    });
}
