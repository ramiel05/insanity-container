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
