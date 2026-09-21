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

`apps/server/src/db/schema.ts` is the single source of truth for the SQLite schema, and generated migration files are the only thing that shapes a durable database (see `docs/adr/0009-migration-files-supersede-push-only-shaping.md`). The workflow after editing `schema.ts`:

```bash
bun --cwd apps/server db:generate
```

Commit the generated file under `apps/server/drizzle/`. Apply migrations to the local dev database (or any database, given `DATABASE_URL`/`DATABASE_AUTH_TOKEN`):

```bash
bun --cwd apps/server db:migrate
```

A fresh clone bootstraps by running all migrations against an empty database — the same command. `drizzle-kit push` is retired and blocked against remote (`libsql://`) databases. Tests migrate temp `file:` databases automatically; no other setup is needed. A drift-guard test fails if the migration files fall behind `schema.ts`.

### Clerk (local dev)

The API rejects unauthenticated requests, and the web app requires a Clerk publishable key at boot, so local development needs the Clerk development-instance keys recorded locally (uncommitted, gitignored):

- `apps/server/.env` → `CLERK_SECRET_KEY`
- `apps/web/.env` → `VITE_CLERK_PUBLISHABLE_KEY`

No Turso connection is needed for local development: with no `DATABASE_URL` set, the server uses a local SQLite file through the same libSQL driver.

Browser tests (`bun run test:browser`) additionally need the owner's Clerk user email in `E2E_CLERK_USER_EMAIL` (both `.env` files are loaded into the Playwright process automatically); the signed-in specs use it with `@clerk/testing` to sign in as that user.

### Lint and format

Linting and formatting are oxc-based and configured at the repo root: `.oxlintrc.json` (aggressive categories + type-aware linting via `oxlint-tsgolint`) and `.oxfmtrc.json` (line width 120, semicolons). Run validation from the repository root:

```bash
bun run lint
bun run format:check
```

Auto-format (also run this before `format:check` if you touched anything):

```bash
bun run format
```

Rules to know when writing code:

- `.oxfmtrc.json` ignores Markdown on purpose — ADRs in `docs/adr/` are immutable, so the formatter never touches prose files.
- `prefer-readonly-parameter-types` runs with `ignoreInferredTypes`, and `lib`/`package` types that cannot be made readonly (`Response`, `RequestInit`, `Error`, `ReactNode`, `UseQueryResult`, `UseMutationResult`, `ZodType`) are on its `allow` list. Object-typed parameters you write yourself must have `readonly` properties.
- Framework-required default exports (`playwright.config.ts`, `vite.config.ts`, `astro.config.mjs`, `drizzle.config.ts`) are exempt from `no-default-export` via a scoped override in `.oxlintrc.json`. Everywhere else, use named exports.
- `react/react-in-jsx-scope` is off (`jsx: "react-jsx"`). Import `React` only as a type (`import type React from "react"`) when a signature needs `React.JSX.Element` or `React.ReactNode`.
- The web API layer (`apps/web/src/lib/api.ts`) wraps `hc<AppType>` in named functions. oxlint-tsgolint types that client as `error`, so `no-unsafe-*` is off for that file only. Call sites use the named functions; do not re-export the client. Web's tsconfig maps the server `#` subpaths so that `AppType` import can follow into server source. Route factories and `createApp` must not annotate `: Hono` — that wipes the inferred route tree — so explicit-return-type rules are off for those files.

### Fail loudly

If a value cannot be missing given the types or the surrounding logic (a regex capture the pattern always produces, an index the algorithm requires), throw. Do not substitute `""`, `0`, `[]`, or `null` to keep going.

### Dependency version policy

Dependencies are pinned with carets to the version currently in use — never use `latest` as a version range. When adding or upgrading a dependency, resolve the concrete version (`npm view <pkg> version`) and record it in the relevant `package.json`.

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

### ADRs

Accepted ADRs in `docs/adr/` stay immutable *for a decision's lifetime*: never rewrite or silently drop a rationale that was already acted on. When implementation reveals a better or necessary alternative, amend the ADR in place — append an **Amended** section stating what changed, why practice demanded it, and the date — rather than minting a superseding ADR for a decision that was just built. Reserve the supersede flow (new ADR replacing the old wholesale) for direction changes: the original decision was genuinely wrong, or later work contradicts it structurally. ADRs document decisions, not infallibility; deviation discovered in practice is part of the record, not an error to bury.
