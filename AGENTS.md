## Local Development

Run both development servers together from the repository root:

```bash
bun install
bun run dev
```

The web app runs at `http://localhost:5173` and the API runs at `http://localhost:3000`. Keep the terminal running while using the app. Stop both servers with `Ctrl-C`.

Run either server individually:

```bash
bun --cwd apps/server dev
bun --cwd apps/web dev
```

### Database

`apps/server/src/db/schema.ts` is the single source of truth for the SQLite schema, and `drizzle-kit push` is the only thing that shapes a database file. Create the schema on a fresh clone (or after deleting the file):

```bash
bun --cwd apps/server db:push
```

After editing `schema.ts`, run the same command: push reconciles the file in place, auto-accepting data loss. On a breaking model change, delete the file instead of reconciling:

```bash
rm apps/server/sqlite.db && bun --cwd apps/server db:push
```

Tests push the schema into a temp file automatically; no other setup is needed. See `docs/adr/0003-schema-ownership-and-database-lifecycle.md`.

Run validation from the repository root:

```bash
bun run typecheck
bun run build
```

## Agent Skills

### Issue tracker

Issues and specs live in GitHub Issues; use the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the canonical labels `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repo using root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.

### ADR immutability

Accepted ADRs in `docs/adr/` are immutable: never amend, edit, or update an accepted ADR. A decision change warrants a new ADR that supersedes the old one.
