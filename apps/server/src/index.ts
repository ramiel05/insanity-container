import { cors } from "hono/cors";
import { Hono } from "hono";
import { db } from "./db";
import { createBlueshiftRoutes, createBlueshiftStarRoutes, createNorthStarRoutes } from "./routes/blueshifts";

export function createApp(database = db) {
  return new Hono()
  .use("/api/*", cors())
   .route("/api/blueshifts", createBlueshiftRoutes(database))
  .route("/api/blueshifts/stars", createBlueshiftStarRoutes(database))
  .route("/api/north-stars", createNorthStarRoutes(database));
}

const routes = createApp();

export type AppType = typeof routes;

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: routes.fetch,
};
