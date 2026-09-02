---
name: hono-endpoints
description: Patterns for this repo's Hono API endpoints and their consumption from the web client. Use when creating or changing an API route on the server, or a query or mutation that calls the API from the web app.
---

# Hono endpoints

Rules for API endpoints on the server and how the web client consumes them, split by side. The examples in each reference are contrived: the pattern is the rule, not any current file, route, or name layout — adapt names to the domain glossary in `CONTEXT.md`.

- Creating or changing a route on the server → read [reference/server.md](reference/server.md).
- Adding or changing a query or mutation that calls the API from the web app → read [reference/client.md](reference/client.md).

## Trust chain

- **Request side: runtime-checked.** The validator parses every request body against the shared Zod schema before the handler runs.
- **Response side: compile-checked at both ends, plus a runtime status gate.** Server handlers and client call sites share the app type through `hc<AppType>`, and the client's funnel gates on the status code at runtime. Response payloads themselves are not runtime-parsed — deliberate, for the current single-client, local-first threat model: client and server ship from the same repo and the same types, so a runtime parse buys no threat reduction, only friction. Revisit only when a new consumer or a hosted phase changes the threat model.
- **The SQLite file's shape is not verified at runtime.** Known, accepted gap while the app is local-first.
