import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { blueshifts, blueshiftStars, redshifts, redshiftStars, settings } from "#db/schema";
import { connectionFromEnv, toFileUrl, type DbConnection } from "./connection";
import { createRecoveringClient } from "./recovering-client";

const schema = { blueshifts, blueshiftStars, redshifts, redshiftStars, settings };

export type Database = LibSQLDatabase<typeof schema>;

export interface DbBundle {
  readonly db: Database;
  readonly client: Client;
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
  const recovering = createRecoveringClient(client);
  return { db: drizzle(recovering, { schema }), client: recovering };
}

export const { db, client } = await createDb(connectionFromEnv());
