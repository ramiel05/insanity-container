import { serveStatic } from "hono/bun";
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

export function createApp(database = db, authenticator: Authenticator = rejectAll, corsEnabled = false) {
  const app = new Hono();
  if (corsEnabled) app.use("/api/*", cors());
  return app
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
    .route("/api/settings", createSettingsRoutes(database))
    .all("/api/*", (c) => c.json({ error: "Not found" }, 404));
}

const routes = createApp();

export type AppType = typeof routes;

if (import.meta.main) {
  const secretKey = process.env.CLERK_SECRET_KEY ?? "";
  if (secretKey.length === 0) {
    throw new Error("CLERK_SECRET_KEY is required");
  }
  const api = createApp(db, createClerkAuthenticator(secretKey));
  let app = api;
  if (process.env.NODE_ENV === "production") {
    const webRoot = process.env.STATIC_WEB_ROOT ?? "./apps/web/dist";
    const atlasRoot = process.env.STATIC_ATLAS_ROOT ?? "./apps/atlas/dist";
    app = new Hono()
      .route("/", api)
      .get("/atlas", (c) => c.redirect("/atlas/"))
      .use("/atlas/*", serveStatic({ root: atlasRoot, rewriteRequestPath: (path) => path.replace(/^\/atlas/u, "") }))
      .use("/*", serveStatic({ root: webRoot }))
      .get("*", serveStatic({ path: `${webRoot}/index.html` }));
  }
  Bun.serve({
    port: Number(process.env.PORT ?? 3000),
    fetch: app.fetch,
  });
}
