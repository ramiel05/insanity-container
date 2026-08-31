# Architecture and Tech Stack

**Status:** accepted  
**Date:** 2026-08-31

Starway uses a Bun native-workspaces monorepo with a Vite/React SPA, a Hono API, Drizzle ORM, and Bun's native SQLite driver for its local-first phase. Shared Zod schemas and Hono's typed RPC client provide end-to-end TypeScript safety; TanStack Query handles frontend server state; Base UI primitives and Tailwind CSS provide accessible behavior with an autonomous visual language. This deliberately favors explicit, low-friction code and zero external services locally over heavier framework conventions.

The potential SaaS phase may move toward Turso/libSQL with database-per-user isolation, but that is a future direction rather than a binding implementation decision until its operational and tenancy trade-offs are validated.

**Consequences**

- Local development needs no Docker, cloud database, or generated API client.
- UI primitives require explicit project styling because Base UI is unstyled.
- Changing the runtime, database driver, or API boundary later carries meaningful migration cost.
