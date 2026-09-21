import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { blueshifts, blueshiftStars, redshifts, redshiftStars, settings } from "#db/schema";

const schema = { blueshifts, blueshiftStars, redshifts, redshiftStars, settings };

export interface DbConnection {
  readonly url: string;
  readonly authToken?: string;
  readonly syncUrl?: string;
}

export type Database = LibSQLDatabase<typeof schema>;

export interface DbBundle {
  readonly db: Database;
  readonly client: Client;
}

function isRemoteUrl(url: string): boolean {
  return url.startsWith("libsql://") || url.startsWith("https://") || url.startsWith("wss://");
}

function toFileUrl(url: string): string {
  if (url.startsWith("file:") || url === ":memory:") return url;
  if (url.startsWith("/")) return `file://${url}`;
  return `file:${url}`;
}

export function connectionFromEnv(env: Readonly<Record<string, string | undefined>> = process.env): DbConnection {
  const url = env.DATABASE_URL ?? "file:sqlite.db";
  if (env.BUN_TEST === "1" && isRemoteUrl(url)) {
    throw new Error("tests must not use a remote DATABASE_URL");
  }
  if (isRemoteUrl(url)) {
    const authToken = env.DATABASE_AUTH_TOKEN ?? "";
    if (authToken.length === 0) {
      throw new Error("DATABASE_AUTH_TOKEN is required for remote databases");
    }
    return { url: "file:replica.db", syncUrl: url, authToken };
  }
  return { url: toFileUrl(url) };
}

export async function createDb(connection: DbConnection | string): Promise<DbBundle> {
  const config = typeof connection === "string" ? { url: toFileUrl(connection) } : connection;
  const client = createClient({
    url: config.url,
    authToken: config.authToken,
    syncUrl: config.syncUrl,
    readYourWrites: typeof config.syncUrl === "string",
  });
  await client.execute("PRAGMA foreign_keys = ON");
  return { db: drizzle(client, { schema }), client };
}

export const { db, client } = await createDb(connectionFromEnv());
