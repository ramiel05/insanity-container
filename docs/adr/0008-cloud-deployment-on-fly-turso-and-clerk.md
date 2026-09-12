# Cloud Deployment: Fly, Turso, and Clerk

**Status:** accepted
**Date:** 2026-09-12

Polaris graduates from a local-only app to a personally-operated cloud deployment, now that entered data is worth keeping. One Bun application deploys to Fly.io in region `syd`: a single machine serves the Hono API, the built web SPA, and the Atlas site from one origin, backed by a Turso (libSQL) database also located in `syd`. Clerk provides auth via GitHub and Google social sign-in, with public sign-ups disabled — only the owner can hold an account. The deployment starts with a fresh Turso database; the local database holds no data worth importing.

`createApp()` remains a pure API Hono app; static file serving is a separate mount layer around it, never entangled with route logic. This is the seam for the eventual multi-user phase (ADR 0001's database-per-user direction): splitting later means pointing a second deploy target at the same pure API app — a config change, not a re-architecture. Same-origin serving keeps CORS out of production entirely; the web client calls `/api` relatively and contains no hardcoded host. All keys and URLs are environment-driven from day one, so the future domain switch is config-only.

There are exactly three story types and no staging environment: local dev runs against a local SQLite file through the same `@libsql/client` driver (`file:` URL) with Clerk development keys on localhost; tests run against fresh temporary local files and never touch Turso; production is the Fly deployment against Turso. For a single-user app, everything production is in production.

**Naming caution:** Until the owner purchases a domain, production runs a Clerk *development instance* — a Clerk product tier for unverified domains, which works on any URL. "Development" there is Clerk's tier label, not one of the app's environments. The Fly deployment is production in every operational sense: real migrations, kept data, enforced auth. Future agents must not infer a staging environment from Clerk dashboard wording, nor treat the deployment database as disposable. The custom domain is a stated prerequisite for the multi-user phase, where it unlocks the production Clerk instance (separate key store, one re-login).

**Considered options**

- Vercel for web + API with a `@hono/node-server/vercel` shim: rejected — would force dropping the Bun runtime for a Node adapter and split the deployment across platforms.
- Three separate Fly apps (API, web, Atlas): rejected — three deploys, three certs, three times the cost, and CORS comes back.
- SQLite on a Fly volume with Litestream backups: rejected — Turso is the managed "safe cloud" product this move actually wants, and the `@libsql/client` swap was needed anyway; volume babysitting is sprawl.
- `userId` scoping on every table now: rejected — with sign-ups disabled, scoping is unreachable dead code; data isolation comes from the future database-per-user provisioning (ADR 0001), and retrofitting a backfill onto a then-empty personal dataset is trivial.

**Consequences**

- `bun:sqlite` is replaced by `@libsql/client` for all database access: production connects via `libsql://` URL and auth token; local dev and tests via `file:` URLs — one driver everywhere.
- CORS middleware remains a dev-only concern (cross-origin `localhost:5173` → `:3000`); production is same-origin.
- Deploys are manual `fly deploy` from the owner's machine; CI auto-deploy waits until a review loop exists to honor.
- Clerk's development instance covers the personal phase on its free tier; upgrading to a production instance is dashboard config plus env swap, never code.
- Scaling the API independently of static assets requires exercising the `createApp()` seam first — by design.
