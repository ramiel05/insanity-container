import { cors } from "hono/cors";
import { Hono } from "hono";
import { db } from "./db";
import { createBlueshiftRoutes, createNorthStarRoutes, createStarRoutes } from "./routes/blueshifts";

export function createApp(database = db) {
  return new Hono()
  .use("/api/*", cors())
   .route("/api/blueshifts", createBlueshiftRoutes(database))
  .route("/api/north-stars", createNorthStarRoutes(database))
  .route("/api/stars", createStarRoutes(database));
}

const routes = createApp();

export type AppType = typeof routes;

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: routes.fetch,
};
