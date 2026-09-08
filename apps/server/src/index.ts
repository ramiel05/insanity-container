import { cors } from "hono/cors";
import { Hono } from "hono";
import { db } from "./db";
import { createBlueshiftRoutes, createBlueshiftStarRoutes, createNorthStarRoutes } from "./routes/blueshifts";
import { createRedshiftRoutes, createRedshiftStarRoutes } from "./routes/redshifts";

export function createApp(database = db) {
  return new Hono()
   .use("/api/*", cors())
   .get("/health", (c) => c.json({ ok: true }))
   .route("/api/blueshifts", createBlueshiftRoutes(database))
  .route("/api/blueshifts/stars", createBlueshiftStarRoutes(database))
  .route("/api/redshifts", createRedshiftRoutes(database))
  .route("/api/redshifts/stars", createRedshiftStarRoutes(database))
  .route("/api/north-stars", createNorthStarRoutes(database));
}

const routes = createApp();

export type AppType = typeof routes;

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: routes.fetch,
};
