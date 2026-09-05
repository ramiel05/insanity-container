# Instanity Container

An app to keep my productivety addiction from making me go insane.

## Getting started

```bash
bun install
bun --cwd apps/server db:push
bun run dev
```

## Database

The schema lives in `apps/server/src/db/schema.ts` and `drizzle-kit push` is the only thing that shapes the database file. After editing the schema, run `bun --cwd apps/server db:push` to reconcile the file (discarding data where the shape changed). On a breaking model change, delete the database and push again:

```bash
rm apps/server/sqlite.db && bun --cwd apps/server db:push
```

## Legend

The Legend is generated from the glossary in `CONTEXT.md` by `packages/legend` into a checked-in artifact (`packages/legend/src/legend.json`). After editing `CONTEXT.md`, regenerate it before testing or building:

```bash
bun run generate
```

A drift-guard test fails if the artifact is stale.
