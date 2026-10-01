export interface DbConnection {
  readonly url: string;
  readonly authToken?: string;
  readonly syncUrl?: string;
}

export const REMOTE_AUTH_TOKEN_REQUIRED = "DATABASE_AUTH_TOKEN is required for remote databases";

export function isRemoteUrl(url: string): boolean {
  return url.startsWith("libsql://") || url.startsWith("https://") || url.startsWith("wss://");
}

export function toFileUrl(url: string): string {
  if (url.startsWith("file:") || url === ":memory:") return url;
  if (url.startsWith("/")) return `file://${url}`;
  return `file:${url}`;
}

export function connectionFromEnv(env: Readonly<Record<string, string | undefined>> = process.env): DbConnection {
  const url = env.DATABASE_URL ?? "file:sqlite.db";
  if (isRemoteUrl(url)) {
    if (env.NODE_ENV !== "production") {
      throw new Error(
        "a remote DATABASE_URL is only allowed in production (NODE_ENV=production, set on the Fly image): local dev and tests run a local SQLite file (ADR 0008). " +
          "Remove DATABASE_URL and DATABASE_AUTH_TOKEN from local .env files or the shell environment — database credentials belong only in Fly and GitHub secrets.",
      );
    }
    const authToken = env.DATABASE_AUTH_TOKEN ?? "";
    if (authToken.length === 0) {
      throw new Error(REMOTE_AUTH_TOKEN_REQUIRED);
    }
    return { url: "file:replica.db", syncUrl: url, authToken };
  }
  return { url: toFileUrl(url) };
}
