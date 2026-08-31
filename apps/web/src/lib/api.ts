import { hc } from "hono/client";
import type { AppType } from "@proj/server";

export const api = hc<AppType>("http://localhost:3000");
