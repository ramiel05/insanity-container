# Architecture and Tech Stack

**Status:** accepted  
**Date:** 2026-08-31

Starway uses a Bun native-workspaces monorepo with a Vite/React SPA, a Hono API, Drizzle ORM, and Bun's native SQLite driver for its local-first phase. Shared Zod schemas and Hono's typed RPC client provide end-to-end TypeScript safety; TanStack Query handles frontend server state; Base UI primitives and Tailwind CSS provide accessible behavior with an autonomous visual language. The stack exists to keep local development free of Docker, cloud databases, and generated clients.

The product is early. Breaking schema and API changes are expected. Do not add migration layers, compatibility aliases, or dual paths to preserve old data or routes; wipe the local database when the model changes. That early-days breakage policy is standing. A preference for a small first cut is not: later work should follow the product, not minimize diff size.

The potential SaaS phase may move toward Turso/libSQL with database-per-user isolation, but that is a future direction rather than a binding implementation decision until its operational and tenancy trade-offs are validated.

**Consequences**

- Local development needs no Docker, cloud database, or generated API client.
- UI primitives require explicit project styling because Base UI is unstyled.
- Changing the runtime, database driver, or API boundary later carries meaningful migration cost.
- Schema and route breaks are resolved by replacing the local database, not by migrating it.
