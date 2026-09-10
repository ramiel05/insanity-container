import { Database } from "bun:sqlite";
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { blueshifts, blueshiftStars, redshifts, redshiftStars, settings } from "#db/schema";

const schema = { blueshifts, blueshiftStars, redshifts, redshiftStars, settings };

export interface DbBundle {
  db: BunSQLiteDatabase<typeof schema>;
  sqlite: Database;
}

export function createDb(path: string): DbBundle {
  const sqlite = new Database(path);
  sqlite.run("PRAGMA foreign_keys = ON");
  return {
    db: drizzle(sqlite, { schema }),
    sqlite,
  };
}

export const { db, sqlite } = createDb(process.env.DATABASE_URL ?? "sqlite.db");
