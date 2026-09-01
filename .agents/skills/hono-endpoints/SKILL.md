---
name: hono-endpoints
description: Patterns for this repo's Hono API endpoints and their consumption from the web client. Use when creating or changing an API route on the server, or a query or mutation that calls the API from the web app.
---

# Hono endpoints

Rules for API endpoints in `apps/server` and how `apps/web` consumes them. The reference implementations are the routes in `apps/server/src/routes/blueshifts.ts`, the mounts in `apps/server/src/index.ts`, and the funnel in `apps/web/src/lib/api.ts`.

## Server: every endpoint

- **Validate requests at the boundary.** Attach the shared Zod schema from `@proj/shared` with `zValidator("json", <schema>)` and read input through `c.req.valid("json")`. Request bodies enter the handler only as validated data.
- **Success responses match their declared type.** Return the exact payload the route's type declares (`c.json(entity)` for reads and updates, `c.json(entity, 201)` for creations). The Hono RPC client infers client-side types from these returns, so the handler's return value is the contract.
- **Every error body rides a non-success status.** Pair `{ error: "..." }` with 404, 400, or 500. A success status carrying an error body breaks the client's one rule for detecting failure; unknown resources report 404 with the same body convention as their siblings.
- **Route names describe exactly what a route returns.** A route mounted under a general name answers the general question; a filtered read model lives under its own name (North Stars at `/api/north-stars`, never a filtered list also mounted at `/api/stars`). One route factory per route name.
- **Timestamp-ordered lists get a stable tiebreaker.** Order by the timestamp, then by a strictly-increasing per-row key so rows created in the same millisecond come back in insertion order. On SQLite use the rowid: `.orderBy(table.createdAt, sql`rowid`)`.

## Client: every call

- **Route every call through the funnel.** `unwrap(await api.<path>.$get(...))` from `apps/web/src/lib/api.ts`, for queries and mutations alike, deletes included. `unwrap` throws an Error carrying the status code and response body text on any non-success status, before any parsing, and resolves `undefined` for empty 204 bodies. Call sites supply no generic: the payload type is inferred from the endpoint, with error-status responses filtered out of the type so an error body can never be mistaken for data.
- **Render the states the data-fetching library reports.** Query pending and error states render visibly and stay distinct from genuinely empty data; a query error shows the shared message with the local-dev hint to start the API (`bun run dev`, API on http://localhost:3000). Mutation errors render near the control that triggered them; creation modals stay open and keep their input on failure.

## Trust chain

- **Request side: runtime-checked.** The validator parses every request body against the shared Zod schema before the handler runs.
- **Response side: compile-checked at both ends, plus a runtime status gate.** Server handlers and client call sites share the app type through `hc<AppType>`, and `unwrap` gates on the status code at runtime. Response payloads themselves are not runtime-parsed — deliberate, for the current single-client, local-first threat model: client and server ship from the same repo and the same types, so a runtime parse buys no threat reduction, only friction. Revisit only when a new consumer or a hosted phase changes the threat model.
- **The SQLite file's shape is not verified at runtime.** Known, accepted gap while the app is local-first.
