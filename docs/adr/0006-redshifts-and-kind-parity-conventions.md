# Redshifts and Kind-Parity Conventions

**Status:** accepted
**Date:** 2026-09-07

Polaris gains a second kind of body of work: the **Redshift**, an open-ended practice that is never completed and whose Stars' completions reset at the start of each day. Blueshifts (goal-oriented, completable) and Redshifts are deliberately modeled as **two parallel table pairs** — `blueshifts`/`blueshift_stars` and `redshifts`/`redshift_stars` — rather than one `shifts` table with a kind discriminator. The shared surface (sidebar, star rendering, modals) was judged larger than the divergent surface, but the divergence that does exist is enforced at the schema level: `redshift_stars` has **no** `north_star` column, making a North Star on a Redshift unrepresentable rather than merely forbidden by API validation. This extends ADR-0002; it does not amend it.

**Considered Options**

- *One `shifts` table + kind discriminator*: one CRUD surface and every cross-cutting feature works on both kinds for free, but kind-guards (`if (kind === "redshift")`) leak through validation, routes, and UI, and North Star exclusion would be a guarded rule instead of an impossible state. Rejected: the schema-level guarantee for North Stars and per-kind freedom to evolve outweighed the duplication.
- *Two parallel tables (chosen)*: illegal states unrepresentable; each kind evolves independently. Cost accepted: star CRUD, zod schemas, and route surfaces are built twice, and every cross-cutting view (sidebar, North Stars panel) merges two sources.

**Consequences**

- **Kind-parity is a standing convention, in both directions.** Anything one kind has structurally, the other must have at the same tier of abstraction. This uplifted existing Blueshift code: the `stars` table is renamed `blueshift_stars`, zod schemas/types are kind-prefixed (`blueshiftStarSchema`, `BlueshiftStar`), and route handlers follow suit. Where the kinds are truly identical, shared components may keep the genus name (the glossary's Star covers both kinds); the split into kind-specific components happens only when rendering genuinely diverges.
- **One representation of "done".** Both star tables store a nullable `completedAt` timestamp; the `completed` boolean is gone. Blueshift ticks are permanent; Redshift ticks reset **virtually** — a tick renders as ticked iff `completedAt` falls within the current day. No cron, no reset job, no per-day rows. Stale ticks are simply old timestamps.
- **Day boundary is a client-side concern.** The server never decides day-ness. The effective timezone is the user's setting when set, otherwise the browser's IANA zone (travel-correct by default). The setting lives in a new singleton `settings` table (`timezone TEXT NULL`, NULL = automatic) — server-backed rather than localStorage despite being the only setting, because settings are expected to grow and localStorage was judged too fiddly.
- **API symmetry.** Both kinds nest everything under their parent: `/api/blueshifts/...` and `/api/redshifts/...` with identical shapes, including star member routes (`PATCH|DELETE /api/blueshifts/stars/:id` ↔ `/api/redshifts/stars/:id`). `/api/north-stars` stays flat: it is a global view across Blueshifts, owned by no single one.
- **Guides vs mechanisms.** Atlas guides that the app does not enforce are labeled as guidance, per-guide; the app genuinely enforces North Star exclusion on Redshifts. This honors the Atlas's "advice, not necessarily mechanism" stance without blanket disclaimers that deny real enforcement.
- **Breaking migration.** Per ADR-0002, the local database is discarded and re-pushed; no migration path is provided.
