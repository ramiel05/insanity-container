# Instanity Container

An app to keep my productivety addiction from making me go insane.

## Getting started

```bash
bun install
bun --cwd apps/server db:migrate
bun run dev
```

Local development needs the Clerk development-instance keys recorded locally (uncommitted):

- `apps/server/.env` → `CLERK_SECRET_KEY`
- `apps/web/.env` → `VITE_CLERK_PUBLISHABLE_KEY`

## Database

The schema lives in `apps/server/src/db/schema.ts` and is the single source of truth. Databases are shaped exclusively by generated migration files: after editing the schema, run `bun --cwd apps/server db:generate` and commit the file it produces under `apps/server/drizzle/`. Apply migrations with:

```bash
bun --cwd apps/server db:migrate
```

`drizzle-kit push` is retired (see `docs/adr/0009-migration-files-supersede-push-only-shaping.md`); production data is never discarded to make a model change easier.

## Deployment

Polaris deploys to Fly.io backed by Turso with Clerk sign-in. Provisioning steps, secrets, and the post-deploy smoke checklist live in `docs/deploy.md`.

## Legend

The Legend is generated from the glossary in `CONTEXT.md` by `packages/legend` into a checked-in artifact (`packages/legend/src/legend.json`). After editing `CONTEXT.md`, regenerate it before testing or building:

```bash
bun run generate
```

A drift-guard test fails if the artifact is stale.
