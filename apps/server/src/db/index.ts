import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { projects, tasks } from "./schema";

const sqlite = new Database(process.env.DATABASE_URL ?? "sqlite.db");
sqlite.run("PRAGMA foreign_keys = ON");
sqlite.run(`CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
)`);
sqlite.run(`CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
)`);

export const db = drizzle(sqlite, { schema: { projects, tasks } });
