# Deploying Polaris: Fly + Turso + Clerk

One Bun application on Fly.io (region `syd`) serves the API, the web app, and Atlas from a single origin, backed by a Turso database in Mumbai (`aws-ap-south-1`) with an embedded replica on the Fly machine. Decisions live in `docs/adr/0008-cloud-deployment-on-fly-turso-and-clerk.md`. This document is the runbook.

## Naming caution

The production deployment runs a Clerk **development instance** until a custom domain exists — "development" there is Clerk's product tier, not an app environment. The Fly deployment is production in every operational sense: real migrations, kept data, enforced auth. Never treat the deployment database as disposable because of Clerk dashboard wording.

## Provisioning (one-off)

Requires authenticated `flyctl` and `turso` CLIs. The Turso database starts **empty**; no local data is imported.

```bash
# 1. Database in Mumbai (nearest Turso region to Australia)
turso db create polaris --location aws-ap-south-1
turso db show polaris --url
turso db tokens create polaris

# 2. Apply migrations to the fresh Turso database (the bootstrap)
DATABASE_URL=libsql://<db-url> DATABASE_AUTH_TOKEN=<token> bun --cwd apps/server db:migrate

# 3. Fly app (adjust the name in fly.toml if taken) and secrets
fly apps create polaris-wayfinder
fly secrets set DATABASE_URL=libsql://<db-url> DATABASE_AUTH_TOKEN=<token> CLERK_SECRET_KEY=<secret>

# 4. Deploy (the web client's Clerk publishable key is build-time env)
fly deploy --build-arg VITE_CLERK_PUBLISHABLE_KEY=<publishable-key>
```

Later deploys are a single `fly deploy` from the laptop — no CI pipeline.

## Post-deploy smoke checklist

1. App loads at the Fly URL and sign-in with GitHub or Google works; the session persists across a refresh.
2. A Blueshift or Redshift round-trip persists: create one, refresh, still there.
3. Atlas renders at `/atlas`.
4. `GET /health` answers `{"ok":true}` without authentication.
5. A signed-out request to an API route (e.g. `/api/blueshifts`) gets a 401.

## Environment contract

- Fly secrets (runtime): `DATABASE_URL` (`libsql://…`), `DATABASE_AUTH_TOKEN`, `CLERK_SECRET_KEY`. With a remote `DATABASE_URL`, the server runs an embedded replica (`file:replica.db` synced from the Turso primary): reads local, writes remote.
- Build-time (web client): `VITE_CLERK_PUBLISHABLE_KEY` via `fly deploy --build-arg` (or `[build.args]` in `fly.toml`).
- Optional (runtime): `STATIC_WEB_ROOT` / `STATIC_ATLAS_ROOT` override the static-serving roots; the defaults are baked for the image layout (`/app`). Static serving itself is active only when `NODE_ENV=production` (set in the Dockerfile).
- Browser tests: `E2E_CLERK_USER_EMAIL` (owner's Clerk user) alongside the local dev keys — see `AGENTS.md`.
- Local dev: no cloud accounts or Turso access — a local SQLite file through the same libSQL driver, with only the two Clerk development keys recorded in the gitignored `.env` files (see `AGENTS.md`).
- Tests never touch the production database: they migrate temporary `file:` databases and inject fake authenticators.
- **Auth is the only cross-environment service.** Every environment (local dev, browser tests, production) shares one Clerk development instance and one account — data stays environment-local (local `file:` databases vs Turso). Clerk therefore requires network access in every environment, including local dev; token verification fetches JWKS from Clerk's API.

Handler posture for future work: server handlers keep sibling statements in a single `client.batch()` call so a logical action pays the write round trip once (ADR 0008); no current handler issues two writes in one action.
