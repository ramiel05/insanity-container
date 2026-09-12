import { defineConfig, type Config } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "sqlite.db";
const isPush = process.argv.includes("push");
if (isPush && url.startsWith("libsql://")) {
  throw new Error(
    "drizzle-kit push is blocked against remote databases (libsql://). Shape changes go through db:generate + db:migrate — see docs/adr/0009.",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: { url },
} satisfies Config);
