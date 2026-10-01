import { defineConfig, type Config } from "drizzle-kit";
import { readDrizzleConnection } from "./src/db/drizzle-connection";

const connection = readDrizzleConnection(process.env, process.argv);

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: connection.isRemote ? "turso" : "sqlite",
  dbCredentials: connection.isRemote
    ? { url: connection.url, authToken: connection.authToken }
    : { url: connection.url },
} satisfies Config);
