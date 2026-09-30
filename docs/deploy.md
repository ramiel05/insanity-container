# Deploying Polaris: Fly + Turso + Clerk

One Bun application on Fly.io (region `syd`) serves the API, the web app, and Atlas from a single origin, backed by a Turso database in Mumbai (`aws-ap-south-1`) with an embedded replica on the Fly machine. Decisions live in `docs/adr/0008-cloud-deployment-on-fly-turso-and-clerk.md` (topology) and `docs/adr/0010-ci-deploy-pipeline-with-maintenance-window.md` (the pipeline and its maintenance window). This document is the runbook.

## Naming caution

The production deployment runs a Clerk **development instance** until a custom domain exists — "development" there is Clerk's product tier, not an app environment. The Fly deployment is production in every operational sense: real migrations, kept data, enforced auth. Never treat the deployment database as disposable because of Clerk dashboard wording.

## Primary deploy path: CI pipeline

Every push to `origin/master` (merge or direct push — there is no branch protection) fires a single GitHub Actions workflow, `.github/workflows/deploy.yml`:

1. **Validation gate** — `lint`, `format:check`, `typecheck`, `test` with Bun, exactly as `AGENTS.md` prescribes. The Playwright browser suite stays local and is not part of the gate.
2. **Maintenance window opens** — the Fly app machine(s) are stopped. While the window is closed the app is unreachable.
3. **Migrations** — `bun --cwd apps/server db:migrate` runs against Turso with `DATABASE_URL`/`DATABASE_AUTH_TOKEN` from repository secrets, honoring ADR 0009 (generated migration files are the only thing that shapes the database).
4. **Deploy** — `fly deploy --remote-only` with the Fly remote builder, passing the web client's `VITE_CLERK_PUBLISHABLE_KEY` as a build argument. On success the new release boots the machine; there is no separate machine-start step.
5. **Verification** — `GET /health` must return `{"ok":true}` without authentication, and a signed-out request to `/api/blueshifts` must get a 401.
6. **Window reopens** — implicitly, when verification passes: the deploy already booted the new release.

**Failure semantics (ADR 0010):** any failure at any stage — including a successful deploy whose health checks fail — leaves the machine **stopped**. One rule: failure ⇒ door closed. The failure email from GitHub's default notifications is the only signal; recovery is manual (see the rollback playbook below). The reason is the window's whole point: restarting after migrations ran but before the deploy succeeded would serve old code against the new schema — the exact desynchronization the window exists to prevent.

**Serial deploys:** a single `concurrency` group with `cancel-in-progress: false` makes back-to-back pushes execute one after another; a second deploy never interrupts the first one's maintenance window.

### One-off setup: GitHub repository secrets

Before the first pipeline run, add four **repository secrets** (not environments):

```bash
gh secret set FLY_API_TOKEN                  # fly auth token (flyctl auth token)
gh secret set DATABASE_URL                   # the Turso libsql:// URL
gh secret set DATABASE_AUTH_TOKEN            # same token value Fly already holds
gh secret set VITE_CLERK_PUBLISHABLE_KEY     # web client's Clerk publishable key
```

The pipeline passes the publishable key as a build argument, so the web client builds correctly inside the Fly remote builder. The Turso token repeats Fly's existing value — no dedicated CI token exists. Do not run the pipeline before the secrets are provisioned: the migrate step hits Turso directly.

### Post-deploy smoke checklist

The workflow itself already automates items 4 and 5; the human checklist covers what automation cannot:

1. App loads at the Fly URL and sign-in with GitHub or Google works; the session persists across a refresh.
2. A Blueshift or Redshift round-trip persists: create one, refresh, still there.
3. Atlas renders at `/atlas`.
4. ~~`GET /health` answers `{"ok":true}` without authentication.~~ — automated in the workflow.
5. ~~A signed-out request to an API route (e.g. `/api/blueshifts`) gets a 401.~~ — automated in the workflow.

## Fallback deploy path: laptop

`fly deploy` from the laptop still exists as the fallback for when the pipeline cannot run (e.g. a Fly incident or an emergency while GitHub Actions is degraded):

```bash
fly deploy --build-arg VITE_CLERK_PUBLISHABLE_KEY=<publishable-key>
```

**Warning:** this bypasses every gate — no lint/typecheck/tests, no migration step, no schema sync — and does not close and reopen the maintenance window. It must normally not be used for changing code or schema; if migrations ran recently in CI and nothing else changed, an image-only redeploy through the fallback is acceptable. Prefer the pipeline for anything that moves code or schema forward.

## Failure and rollback playbook

When a pipeline run fails, the production machine is stopped (ADR 0010). The failure email states which step failed; recover from the laptop:

1. **Validate-stage failure** (lint, format, typecheck, tests): the machine may still be running — the window had not opened yet. Fix, push, let the pipeline redeploy. No downtime occurred.
2. **Failure after the window opened** (migrate, deploy, or verification): the machine is intentionally stopped. Read the failing step:
   - *Migrations failed*: the database may be partially migrated. Inspect with `turso db shell polaris` and reconcile by hand before anything else runs; then fix and push.
   - *Deploy failed*: roll forward by fixing the code and pushing again (the pipeline will migrate nothing new and redeploy), or roll back from the laptop — rollback is always safe to run because the window is closed:
     ```bash
     fly releases rollback
     ```
     A rollback restores the previous release with the schema as it currently is; then push the fix so CI converges the schema and code.
   - *Verification failed after a successful deploy*: either roll forward (fix, push) or `fly releases rollback` from the laptop.
3. After recovery, confirm the app answers `/health` — the pipeline's next successful run reopens the window; a laptop rollback does not, so start the machine (`fly machines start <id> --app polaris-wayfinder`) once the rollback image is up and smoke-check it.

## Environment contract

- Fly secrets (runtime): `DATABASE_URL` (`libsql://…`), `DATABASE_AUTH_TOKEN`, `CLERK_SECRET_KEY`. With a remote `DATABASE_URL`, the server runs an embedded replica (`file:replica.db` synced from the Turso primary): reads local, writes remote.
- Build-time (web client): `VITE_CLERK_PUBLISHABLE_KEY` — in CI it is a repository secret passed as `--build-arg`; via laptop `fly deploy --build-arg` (or `[build.args]` in `fly.toml`).
- GitHub repository secrets (CI only): `FLY_API_TOKEN`, `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `VITE_CLERK_PUBLISHABLE_KEY`.
- Optional (runtime): `STATIC_WEB_ROOT` / `STATIC_ATLAS_ROOT` override the static-serving roots; the defaults are baked for the image layout (`/app`). Static serving itself is active only when `NODE_ENV=production` (set in the Dockerfile).
- Browser tests: `E2E_CLERK_USER_EMAIL` (owner's Clerk user), recorded in `apps/server/.env` next to `CLERK_SECRET_KEY` — see `AGENTS.md`.
- Local dev: no cloud accounts or Turso access — a local SQLite file through the same libSQL driver, with only the two Clerk development keys recorded in the gitignored `.env` files (see `AGENTS.md`).
- Tests never touch the production database: they migrate temporary `file:` databases and inject fake authenticators.
- **Auth is the only cross-environment service.** Every environment (local dev, browser tests, production) shares one Clerk development instance and one account — data stays environment-local (local `file:` databases vs Turso). Clerk therefore requires network access in every environment, including local dev; token verification fetches JWKS from Clerk's API.

Handler posture for future work: server handlers keep sibling statements in a single `client.batch()` call so a logical action pays the write round trip once (ADR 0008); no current handler issues two writes in one action.
