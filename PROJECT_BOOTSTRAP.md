# Project Bootstrap Specification: Local-First Personal Project & Task Manager

## 1. Role & Objective
You are acting as a senior full-stack engineer. Your goal is to bootstrap a clean, type-safe, local-first monorepo for a personal project management application. The architecture must prioritize zero friction for local development, instant performance, and total type safety, while remaining modular enough to introduce multi-tenancy and authentication down the line.

---

## 2. Tech Stack Requirements

* **Runtime & Package Manager:** Bun (v1.4+) natively managing Bun Workspaces
* **Monorepo Architecture:** Monorepo structure using workspace packages:
  * `apps/web`: Frontend SPA
  * `apps/server`: Backend API service
  * `packages/shared`: Shared TypeScript types, Zod schemas, and exported RPC definitions
* **Backend:** Bun + Hono (REST-over-RPC via `hono/client`)
* **Database & ORM:** SQLite (`better-sqlite3` or Bun native SQLite) + Drizzle ORM
* **Frontend:** Vite + React (TypeScript) + TanStack Query (v5)
* **UI & Styling:** Tailwind CSS v4 + Base UI primitives (`@base-ui-components/react`)

---

## 3. Targeted Project Structure

Set up the project with the following directory layout:

```text
├── package.json                   # Root workspace config ("workspaces": ["apps/*", "packages/*"])
├── apps/
│   ├── server/
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   ├── schema.ts      # Drizzle table definitions
│   │   │   │   └── index.ts       # Native bun:sqlite connection handler
│   │   │   ├── routes/
│   │   │   │   └── tasks.ts       # Hono route handlers
│   │   │   ├── index.ts           # Main Hono server (`bun run src/index.ts`)
│   │   │   └── drizzle.config.ts  # Drizzle configuration
│   │   └── package.json           # name: "@proj/server"
│   └── web/
│       ├── src/
│       │   ├── components/
│       │   │   └── ui/            # Wrapped Base UI primitives styled with Tailwind
│       │   ├── lib/
│       │   │   ├── api.ts         # Typed Hono RPC client (`hc<AppType>`)
│       │   │   └── query-client.ts# TanStack Query client instance
│       │   ├── app.css            # Tailwind CSS v4 import + @theme token definitions
│       │   ├── App.tsx            # Test UI verifying E2E data flow
│       │   └── main.tsx
│       └── package.json           # name: "@proj/web"
└── packages/
    └── shared/
        ├── src/
        │   └── index.ts           # Re-exported Zod schemas & common utilities
        └── package.json           # name: "@proj/shared"
```

## 4. Execution Steps

### Step 1: Workspace & Dependency Initialization
1. Initialize the root `package.json` with workspace configuration:
   ```json
   {
     "name": "project-root",
     "private": true,
     "workspaces": ["apps/*", "packages/*"],
     "scripts": {
       "dev": "bun --filter \"*\" dev"
     }
   }
   ```
2. Install workspace dependencies using native Bun filtering (`bun add <pkg> --filter <target>`):
   * **Server (`apps/server`):** `bun add hono drizzle-orm zod --filter @proj/server` and `bun add -d drizzle-kit @types/bun --filter @proj/server` (using native `bun:sqlite` for DB driver).
   * **Web (`apps/web`):** `bun add react react-dom @tanstack/react-query @base-ui-components/react @tailwindcss/vite tailwindcss --filter @proj/web` and `bun add -d vite @types/react --filter @proj/web`.
   * **Shared (`packages/shared`):** `bun add zod --filter @proj/shared`.
3. Link `@proj/shared` into `apps/web` and `apps/server` using the `"@proj/shared": "workspace:*"` dependency in their respective `package.json` files.

### Step 2: Database & Server Implementation (`apps/server`)
1. Create a Drizzle SQLite schema in `apps/server/src/db/schema.ts` defining two basic tables:
   * `projects` (`id` text/uuid primary key, `name` text, `createdAt` integer)
   * `tasks` (`id` text/uuid primary key, `projectId` text foreign key, `title` text, `completed` boolean, `createdAt` integer)
2. Configure `db/index.ts` to output a local `sqlite.db` file using `bun:sqlite`.
3. Build a Hono routing structure in `apps/server/src/routes/tasks.ts` with standard endpoints:
   * `GET /api/tasks` (List tasks)
   * `POST /api/tasks` (Create task)
   * `PATCH /api/tasks/:id` (Toggle completion)
4. Export the Hono application type from `apps/server/src/index.ts`:
   ```typescript
   export type AppType = typeof routes;
   ```

### Step 3: Frontend Setup (`apps/web`)
1. Configure Vite with Tailwind v4 support.
2. Define basic design tokens in `app.css` using Tailwind `@theme` (colors for surface, accent, borders, radii).
3. Initialize the RPC client in `apps/web/src/lib/api.ts` using `hc<AppType>` pointing to `http://localhost:3000`.
4. Wrap one Base UI primitive (e.g., a Dialog or Popover component) in `apps/web/src/components/ui/` with Tailwind classes to verify the component pattern.
5. In `App.tsx`, build a simple UI that uses TanStack Query to fetch and mutate tasks using the typed `api` client.

### Step 3: Frontend Setup (`apps/web`)

1. Configure Vite with Tailwind v4 support.
2. Define basic design tokens in `app.css` using Tailwind `@theme` (colors for surface, accent, borders, radii).
3. Initialize the RPC client in `apps/web/src/lib/api.ts` using `hc<AppType>` pointing to `http://localhost:3000`.
4. Wrap one Base UI primitive (e.g., a Dialog or Popover component) in `apps/web/src/components/ui/` with Tailwind classes to verify the component pattern.
5. In `App.tsx`, build a simple UI that uses TanStack Query to fetch and mutate tasks using the typed `api` client.

---

## 5. Architectural Guardrails

* **No Speculative Abstractions:** Keep backend queries simple and direct. Do not write custom abstraction layers over Drizzle or TanStack Query.
* **Type Safety:** Ensure front-to-back type safety is strictly preserved via Hono's `AppType` import. No manual typing of API response objects in the frontend.
* **Component Styling:** Do not add opinionated default UI libraries (like shadcn/ui or Radix). Rely strictly on unstyled `@base-ui-components/react` primitives and explicit Tailwind v4 classes.

Execute these setup steps, create the files, verify that both dev servers start without errors, and test that a task can be created and queried end-to-end.
