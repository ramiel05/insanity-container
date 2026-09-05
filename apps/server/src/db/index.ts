import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { blueshifts, stars } from "./schema";

export function createDb(path: string) {
  const sqlite = new Database(path);
  sqlite.run("PRAGMA foreign_keys = ON");
  return { db: drizzle(sqlite, { schema: { blueshifts, stars } }), sqlite };
}

export const { db, sqlite } = createDb(process.env.DATABASE_URL ?? "sqlite.db");
