import { createBlueshiftSchema, createBlueshiftStarSchema, updateBlueshiftStarSchema } from "@proj/shared";
import { zValidator } from "@hono/zod-validator";
import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import type { db as defaultDb } from "../db";
import { blueshifts, blueshiftStars } from "../db/schema";

type Database = typeof defaultDb;

export function createBlueshiftRoutes(database: Database) {
  const app = new Hono()
    .get("/", async (c) => c.json(await database.select().from(blueshifts).orderBy(blueshifts.createdAt, sql`rowid`)))
    .post("/", zValidator("json", createBlueshiftSchema), async (c) => {
      const input = c.req.valid("json");
      const blueshift = { id: crypto.randomUUID(), name: input.name, goal: input.goal || null, createdAt: Date.now() };
      await database.insert(blueshifts).values(blueshift);
      return c.json(blueshift, 201);
    })
    .delete("/:id", async (c) => {
      const [deleted] = await database.delete(blueshifts).where(eq(blueshifts.id, c.req.param("id"))).returning();
      if (!deleted) return c.json({ error: "Blueshift not found" }, 404);
      return c.body(null, 204);
    })
    .get("/:id/stars", async (c) => {
      const [blueshift] = await database.select().from(blueshifts).where(eq(blueshifts.id, c.req.param("id")));
      if (!blueshift) return c.json({ error: "Blueshift not found" }, 404);
      return c.json(await database.select().from(blueshiftStars).where(eq(blueshiftStars.blueshiftId, c.req.param("id"))).orderBy(blueshiftStars.createdAt, sql`rowid`));
    })
    .post("/:id/stars", zValidator("json", createBlueshiftStarSchema), async (c) => {
      const blueshift = await database.select().from(blueshifts).where(eq(blueshifts.id, c.req.param("id"))).get();
      if (!blueshift) return c.json({ error: "Blueshift not found" }, 404);
      const input = c.req.valid("json");
      const star = { id: crypto.randomUUID(), blueshiftId: blueshift.id, title: input.title, completedAt: null, northStar: false, createdAt: Date.now() };
      await database.insert(blueshiftStars).values(star);
      return c.json(star, 201);
    });

  return app;
}

export function createNorthStarRoutes(database: Database) {
  return new Hono().get("/", async (c) => c.json(await database.select().from(blueshiftStars).where(eq(blueshiftStars.northStar, true)).orderBy(blueshiftStars.createdAt, sql`rowid`)));
}

export function createBlueshiftStarRoutes(database: Database) {
  return new Hono()
    .patch("/:id", zValidator("json", updateBlueshiftStarSchema), async (c) => {
      const input = c.req.valid("json");
      const set: Partial<typeof blueshiftStars.$inferInsert> = {};
      if (input.completed !== undefined) set.completedAt = input.completed ? Date.now() : null;
      if (input.northStar !== undefined) set.northStar = input.northStar;
      const [star] = await database.update(blueshiftStars).set(set).where(eq(blueshiftStars.id, c.req.param("id"))).returning();
      if (!star) return c.json({ error: "Blueshift star not found" }, 404);
      return c.json(star);
    })
    .delete("/:id", async (c) => {
      const [deleted] = await database.delete(blueshiftStars).where(and(eq(blueshiftStars.id, c.req.param("id")))).returning();
      if (!deleted) return c.json({ error: "Blueshift star not found" }, 404);
      return c.body(null, 204);
    });
}
