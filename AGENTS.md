## Local Development

Run both development servers together from the repository root:

```bash
bun install
bun run dev
```

The web app runs at `http://localhost:5173`, the API runs at `http://localhost:3000`, and the Atlas site runs at `http://localhost:4321`. Keep the terminal running while using the app. Stop all servers with `Ctrl-C`.

Run any server individually:

```bash
bun --cwd apps/server dev
bun --cwd apps/web dev
bun --cwd apps/atlas dev
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

### Legend

`CONTEXT.md` is the canonical glossary, and `packages/legend` parses it into a checked-in generated artifact (`packages/legend/src/legend.json`). After editing `CONTEXT.md`, run `bun run generate` from the repository root before testing or building; the drift-guard test fails on a stale artifact. See `docs/adr/0004-legend-generated-from-glossary.md` and `docs/adr/0005-legend-generator-runs-on-demand.md`.

### Package scripts

Each package.json script handles exactly one concern. Never chain steps into a script with `&&` (for example, running a generator inside `dev` or `build`); keep each step as its own script and run them in sequence. If chaining typical workflows becomes tedious, introduce a dedicated convenience layer (e.g. a Makefile) rather than overloading scripts.

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
