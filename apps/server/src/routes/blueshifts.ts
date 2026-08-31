import { createBlueshiftSchema, createStarSchema, updateStarSchema } from "@proj/shared";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import type { db as defaultDb } from "../db";
import { blueshifts, stars } from "../db/schema";

type Database = typeof defaultDb;

export function createBlueshiftRoutes(database: Database) {
  const app = new Hono()
    .get("/", async (c) => c.json(await database.select().from(blueshifts).orderBy(blueshifts.createdAt)))
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
    .get("/:id/stars", async (c) => c.json(await database.select().from(stars).where(eq(stars.blueshiftId, c.req.param("id"))).orderBy(stars.createdAt)))
    .post("/:id/stars", zValidator("json", createStarSchema), async (c) => {
      const blueshift = await database.select().from(blueshifts).where(eq(blueshifts.id, c.req.param("id"))).get();
      if (!blueshift) return c.json({ error: "Blueshift not found" }, 404);
      const input = c.req.valid("json");
      const star = { id: crypto.randomUUID(), blueshiftId: blueshift.id, title: input.title, completed: false, northStar: false, createdAt: Date.now() };
      await database.insert(stars).values(star);
      return c.json(star, 201);
    });

  return app;
}

export function createStarRoutes(database: Database) {
  return new Hono()
    .get("/", async (c) => c.json(await database.select().from(stars).where(eq(stars.northStar, true)).orderBy(stars.createdAt)))
    .patch("/:id", zValidator("json", updateStarSchema), async (c) => {
      const [star] = await database.update(stars).set(c.req.valid("json")).where(eq(stars.id, c.req.param("id"))).returning();
      if (!star) return c.json({ error: "Star not found" }, 404);
      return c.json(star);
    })
    .delete("/:id", async (c) => {
      const [deleted] = await database.delete(stars).where(and(eq(stars.id, c.req.param("id")))).returning();
      if (!deleted) return c.json({ error: "Star not found" }, 404);
      return c.body(null, 204);
    });
}
