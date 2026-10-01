import { isRemoteUrl, REMOTE_AUTH_TOKEN_REQUIRED } from "./connection";

export interface DrizzleConnection {
  readonly url: string;
  readonly authToken: string;
  readonly isRemote: boolean;
}

export function readDrizzleConnection(
  env: Readonly<Record<string, string | undefined>>,
  argv: readonly string[],
): DrizzleConnection {
  const url = env.DATABASE_URL ?? "sqlite.db";
  const authToken = env.DATABASE_AUTH_TOKEN ?? "";
  const isRemote = isRemoteUrl(url);
  if (argv.includes("push") && isRemote) {
    throw new Error(
      "drizzle-kit push is blocked against remote databases (libsql://). Shape changes go through db:generate + db:migrate — see docs/adr/0009.",
    );
  }
  if (isRemote) {
    if (env.CI !== "true") {
      throw new Error(
        "remote migrations run only in CI (ADR 0010): a laptop db:migrate against production leaves no audit trail, so it is an incident smell — fix the pipeline instead (docs/deploy.md). " +
          "Bypass deliberately by setting CI=true, and record why.",
      );
    }
    if (authToken.length === 0) {
      throw new Error(REMOTE_AUTH_TOKEN_REQUIRED);
    }
  }
  return { url, authToken, isRemote };
}
