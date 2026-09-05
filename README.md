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
