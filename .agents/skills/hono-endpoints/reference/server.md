# Server endpoints

Reference for creating or changing a Hono route on the server. The example below is contrived; the pattern is the rule.

## Rules

- **Validate requests at the boundary.** Attach the shared Zod schema from `@proj/shared` with `zValidator("json", <schema>)` and read input through `c.req.valid("json")`. Request bodies enter the handler only as validated data.
- **Success responses match their declared type.** Return the exact payload the route's type declares (`c.json(entity)` for reads and updates, `c.json(entity, 201)` for creations). The Hono RPC client infers client-side types from these returns, so the handler's return value is the contract.
- **Every error body rides a non-success status.** Pair `{ error: "..." }` with 404, 400, or 500. A success status carrying an error body breaks the client's one rule for detecting failure; unknown resources report 404 with the same body convention as their siblings.
- **Route names describe exactly what a route returns.** A route mounted under a general name answers the general question; a filtered read model lives under its own name. One route factory per route name.
- **Timestamp-ordered lists get a stable tiebreaker.** Order by the timestamp, then by a strictly-increasing per-row key so rows created in the same millisecond come back in insertion order. On SQLite use the rowid: `.orderBy(table.createdAt, sql`rowid`)`.

## Example

One route factory showing the shapes: a timestamp-ordered list, a child listing with a not-found check on the parent resource, and a validated creation.

```ts
import { createGizmoSchema } from "@proj/shared";
import { zValidator } from "@hono/zod-validator";
import { eq, sql } from "drizzle-orm";
import { Hono } from "hono";

export function createGizmoRoutes(database: Database) {
  return new Hono()
    .get("/", async (c) => c.json(await database.select().from(gizmos).orderBy(gizmos.createdAt, sql`rowid`)))
    .get("/:id/parts", async (c) => {
      const [gizmo] = await database.select().from(gizmos).where(eq(gizmos.id, c.req.param("id")));
      if (!gizmo) return c.json({ error: "Gizmo not found" }, 404);
      return c.json(await database.select().from(parts).where(eq(parts.gizmoId, gizmo.id)).orderBy(parts.createdAt, sql`rowid`));
    })
    .post("/", zValidator("json", createGizmoSchema), async (c) => {
      const input = c.req.valid("json");
      const gizmo = { id: crypto.randomUUID(), name: input.name, createdAt: Date.now() };
      await database.insert(gizmos).values(gizmo);
      return c.json(gizmo, 201);
    });
}
```
