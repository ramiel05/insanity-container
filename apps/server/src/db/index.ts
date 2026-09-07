import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { blueshifts, blueshiftStars, redshifts, redshiftStars } from "./schema";

export function createDb(path: string) {
  const sqlite = new Database(path);
  sqlite.run("PRAGMA foreign_keys = ON");
  return { db: drizzle(sqlite, { schema: { blueshifts, blueshiftStars, redshifts, redshiftStars } }), sqlite };
}

export const { db, sqlite } = createDb(process.env.DATABASE_URL ?? "sqlite.db");
