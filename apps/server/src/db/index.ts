import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { blueshifts, stars } from "./schema";

export function createDb(path: string) {
  const sqlite = new Database(path);
  sqlite.run("PRAGMA foreign_keys = ON");
  sqlite.run(`CREATE TABLE IF NOT EXISTS blueshifts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  goal TEXT,
  created_at INTEGER NOT NULL
)`);
  sqlite.run(`CREATE TABLE IF NOT EXISTS stars (
  id TEXT PRIMARY KEY,
  blueshift_id TEXT NOT NULL REFERENCES blueshifts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  north_star INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
)`);
  return { db: drizzle(sqlite, { schema: { blueshifts, stars } }), sqlite };
}

export const { db, sqlite } = createDb(process.env.DATABASE_URL ?? "sqlite.db");
