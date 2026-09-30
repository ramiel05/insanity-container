# CI deployment pipeline with a stop–deploy–start maintenance window

Deploys now run in CI: a single GitHub Actions workflow on every push to `origin/master` validates the code (lint, format, typecheck, unit tests — the browser suite stays local), then closes the maintenance window by stopping the Fly machine, runs drizzle migrations against Turso, deploys with `fly deploy`, verifies (`/health` returns ok, signed-out API request is 401), and reopens the window by bringing the new release up. The app is only ever usable when client, server, and schema are all in sync.

## Considered Options

- **Additive/forward-compatible migration contract** (schema always ships ahead and old code tolerates the new schema, enabling zero-downtime deploys): rejected. It buys graceful degradation only on failure paths, but its discipline cost — breaking changes become two full deploy cycles — recurs on every breaking migration. The maintenance window makes breaking migrations cheap: nothing is running while the schema moves ahead.
- **Restart the machine on pipeline failure** ("no silent outage"): rejected. A restart after migrations ran but before deploy succeeded would serve old code against the new schema with the window open — exactly the desync the window exists to prevent. Any failure at any stage instead leaves the machine stopped; the failure email is the only signal, and recovery (roll forward or `fly releases rollback`) happens manually from the laptop while the app is down.
- **App-level maintenance mode** (503 page via a Fly secret): deferred. At current scale a connection failure during the window is acceptable; a friendly maintenance page joins the same future milestone as tag-triggered deploys.

## Consequences

- Any pipeline failure ends with the production machine stopped — including a successful `fly deploy` whose post-deploy health checks fail. One rule: failure ⇒ door closed, fixed forward or rolled back by hand.
- A failed post-migration state can leave the database ahead of the deployed code; the machine stays down until a human reconciles it. Data-safe but silently offline until the failure email is read.
- Rollback (`fly releases rollback`) is always safe to run because it happens with the window closed.
- There is no branch protection: any push to `origin/master` deploys. Trigger switching to version tags when the app opens for public use (tracked in a GitHub issue).
