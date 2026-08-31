import { cors } from "hono/cors";
import { Hono } from "hono";
import { taskRoutes } from "./routes/tasks";

const routes = new Hono()
  .use("/api/*", cors())
  .route("/api/tasks", taskRoutes);

export type AppType = typeof routes;

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: routes.fetch,
};
