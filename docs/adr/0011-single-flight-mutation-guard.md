# Single-flight guard at the workspace mutation choke point

Accidental duplicate submissions (a double-click on a modal's Create button producing two identical Blueshifts) cannot be guarded at the UI layer alone: buttons do not cover Enter-key submits, programmatic dispatch from the confirm modal, or multiple surfaces dispatching to the same target. Every mutation therefore passes through a single-flight keyed lock in the mutation factory — the same choke point all mutations already flow through — keyed by mutation kind plus target id; a second invocation of an action whose key is in-flight is dropped silently, and the lock releases on settle (success or failure), never on a timer.

Because every mutation must route through the factory for the guard to hold, importing `@tanstack/react-query` outside the sanctioned workspace lib files is banned by a lint rule (`no-restricted-imports` with a message pointing at the sanctioned path). The guarantee is structural, not disciplinary: no new feature or component can create an unguarded mutation.

Considered and rejected:

- **A base `MutationButton` component** — discipline-dependent (new features must adopt it) and blind to Enter keys and programmatic dispatch; kept, if at all, as a presentation consumer of pending state, never as the guard.
- **Optimistic updates (#20) as a by-product** — optimism does not dedupe creates: two fire-and-forget calls are two server rows regardless of how instantly the UI reflects them.
- **Server-side idempotency keys** — covers accidental double-clicks only partially while adding server machinery; deferred as a possible future ticket (retries/tabs are a different problem from local double-fire).
- **Debounce-style delays** — meaning-inverted mechanism: debounce delays firing to merge intent; single-flight dedupes after firing. Delay-to-fire would make every deliberate action feel sluggish to "prevent" a bug the lock already prevents.

Consequences: quick toggles (e.g. a Star checkbox) get the lock but intentionally no visual pending state; visible pending-disable is reserved for blocking flows (shift create dialog, settings save, Add Star forms), appearing at first fire so nothing looks clickable while it cannot fire again. See the In-flight entry in `CONTEXT.md` and the "In-flight" spec in the issue tracker.
