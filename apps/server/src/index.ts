import { cors } from "hono/cors";
import { Hono } from "hono";
import { createClerkAuthenticator, rejectAll, type Authenticator } from "./auth";
import { db } from "#db";
import {
  createBlueshiftNestedStarRoutes,
  createBlueshiftRoutes,
  createBlueshiftStarRoutes,
  createNorthStarRoutes,
} from "#routes/blueshifts";
import { createRedshiftNestedStarRoutes, createRedshiftRoutes, createRedshiftStarRoutes } from "#routes/redshifts";
import { createSettingsRoutes } from "#routes/settings";

export function createApp(database = db, authenticator: Authenticator = rejectAll) {
  return new Hono()
    .use("/api/*", cors())
    .use("/api/*", async (c, next) => {
      const user = await authenticator(c.req.raw);
      if (user === null) return c.json({ error: "Unauthorized" }, 401);
      return next();
    })
    .get("/health", (c) => c.json({ ok: true }))
    .route("/api/blueshifts", createBlueshiftRoutes(database))
    .route("/api/blueshifts", createBlueshiftNestedStarRoutes(database))
    .route("/api/blueshifts/stars", createBlueshiftStarRoutes(database))
    .route("/api/redshifts", createRedshiftRoutes(database))
    .route("/api/redshifts", createRedshiftNestedStarRoutes(database))
    .route("/api/redshifts/stars", createRedshiftStarRoutes(database))
    .route("/api/north-stars", createNorthStarRoutes(database))
    .route("/api/settings", createSettingsRoutes(database));
}

const routes = createApp();

export type AppType = typeof routes;

if (import.meta.main) {
  const secretKey = process.env.CLERK_SECRET_KEY ?? "";
  if (secretKey.length === 0) {
    throw new Error("CLERK_SECRET_KEY is required");
  }
  const api = createApp(db, createClerkAuthenticator(secretKey));
  Bun.serve({
    port: Number(process.env.PORT ?? 3000),
    fetch: api.fetch,
  });
}
