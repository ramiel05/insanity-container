import { serveStatic } from "hono/bun";
import { Hono } from "hono";
import { createClerkAuthenticator } from "./auth";
import { createApp } from "./index";
import { db } from "#db";

const secretKey = process.env.CLERK_SECRET_KEY ?? "";
if (secretKey.length === 0) {
  throw new Error("CLERK_SECRET_KEY is required");
}

const api = createApp(db, createClerkAuthenticator(secretKey));

const webRoot = process.env.STATIC_WEB_ROOT ?? "./apps/web/dist";
const atlasRoot = process.env.STATIC_ATLAS_ROOT ?? "./apps/atlas/dist";

const app = new Hono()
  .route("/", api)
  .all("/api/*", (c) => c.json({ error: "Not found" }, 404))
  .get("/atlas", (c) => c.redirect("/atlas/"))
  .use("/atlas/*", serveStatic({ root: atlasRoot, rewriteRequestPath: (path) => path.replace(/^\/atlas/u, "") }))
  .use("/*", serveStatic({ root: webRoot }))
  .get("*", serveStatic({ path: `${webRoot}/index.html` }));

Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch,
});
