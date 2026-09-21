import { defineConfig, type Config } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "sqlite.db";
const authToken = process.env.DATABASE_AUTH_TOKEN ?? "";
const isRemote = url.startsWith("libsql://") || url.startsWith("https://");
const isPush = process.argv.includes("push");
if (isPush && isRemote) {
  throw new Error(
    "drizzle-kit push is blocked against remote databases (libsql://). Shape changes go through db:generate + db:migrate — see docs/adr/0009.",
  );
}
if (isRemote && authToken.length === 0) {
  throw new Error("DATABASE_AUTH_TOKEN is required for remote databases");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: isRemote ? "turso" : "sqlite",
  dbCredentials: isRemote ? { url, authToken } : { url },
} satisfies Config);
