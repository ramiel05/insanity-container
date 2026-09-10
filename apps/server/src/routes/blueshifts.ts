import { createBlueshiftSchema, createBlueshiftStarSchema, updateBlueshiftStarSchema } from "@proj/shared";
import { zValidator } from "@hono/zod-validator";
import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "#db";
import { blueshifts, blueshiftStars } from "#db/schema";

export function createBlueshiftRoutes(database = db) {
  return new Hono()
    .get("/", async (c) =>
      c.json(
        await database
          .select()
          .from(blueshifts)
          .orderBy(blueshifts.createdAt, sql`rowid`),
      ),
    )
    .post("/", zValidator("json", createBlueshiftSchema), async (c) => {
      const input = c.req.valid("json");
      const blueshift = { id: crypto.randomUUID(), name: input.name, goal: input.goal ?? null, createdAt: Date.now() };
      await database.insert(blueshifts).values(blueshift);
      return c.json(blueshift, 201);
    })
    .delete("/:id", async (c) => {
      const [deleted] = await database
        .delete(blueshifts)
        .where(eq(blueshifts.id, c.req.param("id")))
        .returning();
      if (!deleted) return c.json({ error: "Blueshift not found" }, 404);
      return c.body(null, 204);
    });
}

export function createBlueshiftNestedStarRoutes(database = db) {
  return new Hono()
    .get("/:id/stars", async (c) => {
      const [blueshift] = await database
        .select()
        .from(blueshifts)
        .where(eq(blueshifts.id, c.req.param("id")));
      if (!blueshift) return c.json({ error: "Blueshift not found" }, 404);
      return c.json(
        await database
          .select()
          .from(blueshiftStars)
          .where(eq(blueshiftStars.blueshiftId, c.req.param("id")))
          .orderBy(blueshiftStars.createdAt, sql`rowid`),
      );
    })
    .post("/:id/stars", zValidator("json", createBlueshiftStarSchema), async (c) => {
      const [blueshift] = await database
        .select()
        .from(blueshifts)
        .where(eq(blueshifts.id, c.req.param("id")));
      if (!blueshift) return c.json({ error: "Blueshift not found" }, 404);
      const input = c.req.valid("json");
      const star = {
        id: crypto.randomUUID(),
        blueshiftId: blueshift.id,
        title: input.title,
        completedAt: null,
        northStar: false,
        createdAt: Date.now(),
      };
      await database.insert(blueshiftStars).values(star);
      return c.json(star, 201);
    });
}

export function createNorthStarRoutes(database = db) {
  return new Hono().get("/", async (c) =>
    c.json(
      await database
        .select()
        .from(blueshiftStars)
        .where(eq(blueshiftStars.northStar, true))
        .orderBy(blueshiftStars.createdAt, sql`rowid`),
    ),
  );
}

export function createBlueshiftStarRoutes(database = db) {
  return new Hono()
    .patch("/:id", zValidator("json", updateBlueshiftStarSchema), async (c) => {
      const input = c.req.valid("json");
      const set: Partial<typeof blueshiftStars.$inferInsert> = {};
      if ("completed" in input) set.completedAt = input.completed === true ? Date.now() : null;
      if ("northStar" in input) set.northStar = input.northStar === true;
      const [star] = await database
        .update(blueshiftStars)
        .set(set)
        .where(eq(blueshiftStars.id, c.req.param("id")))
        .returning();
      if (!star) return c.json({ error: "Blueshift star not found" }, 404);
      return c.json(star);
    })
    .delete("/:id", async (c) => {
      const [deleted] = await database
        .delete(blueshiftStars)
        .where(and(eq(blueshiftStars.id, c.req.param("id"))))
        .returning();
      if (!deleted) return c.json({ error: "Blueshift star not found" }, 404);
      return c.body(null, 204);
    });
}
