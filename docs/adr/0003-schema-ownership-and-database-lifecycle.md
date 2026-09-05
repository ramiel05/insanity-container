# Schema Ownership and Database Lifecycle

**Status:** accepted
**Date:** 2026-09-03

The Drizzle schema in `apps/server/src/db/schema.ts` is the single source of truth for the SQLite database's shape. `drizzle-kit push` is the only mechanism that shapes a database file: it reconciles the file against the schema, creating and altering tables as needed, with data loss auto-accepted. No hand-written DDL exists; the server merely opens the file at boot and never mutates its shape. Tests push the schema into a temporary file before opening it.

Because the product is early, the standing policy on breaking model changes is to discard the data rather than write migrations or backward-compatibility code. The escape hatch from any push failure is deleting the database file and pushing again. This policy expires the moment the file holds data worth keeping: at that point `--force` comes out of the push script, migrations are introduced, and a new ADR records the shift.

**Consequences**

- `bun run db:push` in `apps/server` is the only schema command; forgetting it after a schema edit fails loudly on the first query.
- Push reconciles in place and discards data where the shape changed; destructive prompts are never shown.
- A push that errors (for example, foreign-key ordering against legacy tables) is resolved by deleting the file and re-pushing.
- The dev database file is disposable until the expiry trigger is met.
