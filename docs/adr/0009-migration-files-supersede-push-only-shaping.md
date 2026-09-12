# Migration Files Supersede Push-Only Database Shaping

**Status:** accepted
**Date:** 2026-09-12

ADR 0003's expiry trigger has fired: the deployment database (Turso, per ADR 0008) will hold data worth keeping, and `drizzle-kit push --force` — which auto-accepts data loss — is no longer an acceptable shaping mechanism against it. Migration files are now the only mechanism that shapes any durable database: `drizzle-kit generate` turns schema edits into checked-in migration files, and `drizzle-kit migrate` applies them against a local file, a fresh test database, or Turso alike. The Drizzle schema in `apps/server/src/db/schema.ts` remains the single source of truth; migration files are derived artifacts of that schema, not hand-written DDL.

This ADR supersedes ADR 0003, which remains an accepted immutable snapshot. Its schema-ownership stance is unchanged — `schema.ts` is still the single source of truth and the server never mutates shape at boot. What changes is the shaping mechanism (push → generated migrations) and the disposal policy's scope: it is void for the deployment database. Production data is never discarded to resolve a model change; a breaking change is handled with migrations, and any unavoidably destructive step is reviewed by the owner before it touches Turso.

**Consequences**

- The push-only workflow (`bun run db:push`) is retired from the standard schema-edit loop; the loop is now edit `schema.ts` → `drizzle-kit generate` → commit the migration file.
- A fresh environment is bootstrapped by running all migration files against an empty database — Turso, a local dev file, or a fresh test file — never by pushing.
- Generating is local and offline; only `migrate` needs to reach Turso, so schema authoring never depends on connectivity.
- Forgetting to generate after a schema edit means the next `generate` shows uncommitted drift — the loud signal that a migration file is missing.
