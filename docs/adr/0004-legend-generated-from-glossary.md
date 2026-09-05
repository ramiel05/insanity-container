# Legend Generated from the Glossary at Build Time

**Status:** accepted
**Date:** 2026-09-05

The root glossary (`CONTEXT.md`) is the single source of truth for Polaris's concept definitions. The Legend — the quick-reference of concepts shown wherever it is needed — is not maintained by hand anywhere: it is generated from the glossary by the `@proj/legend` package. A generator script parses the glossary into an ordered list of `{ section, term, definition }` entries (preserving glossary section order, excluding `_Avoid_` lines, and emitting both domain and meta concepts tagged by section) and writes a checked-in JSON artifact. The repository root `dev` and `build` scripts run the generator before anything else, so no one regenerates manually; a drift-guard test asserts the checked-in artifact exactly matches a fresh parse of the glossary, catching staleness immediately.

The alternative was duplicating definitions into each surface (app component, Atlas site) and keeping them in sync by hand. Duplication guarantees drift as the glossary evolves; generation makes the glossary the only place a definition can change, at the cost of a parser coupled to the glossary's formatting and a generated artifact in version control. The coupling is acceptable because the glossary's shape is stable and simple, and checking in the artifact keeps every consumer build hermetic — no consumer needs to parse Markdown at build or run time.

**Consequences**

- Editing a definition means editing `CONTEXT.md` only; surfaces pick the change up on the next generate.
- The glossary must stay parseable: no methodology advice, no implementation details, entries in the `**Term**:` / definition / `_Avoid_:` shape.
- Consumers import the parsed Legend from `@proj/legend` rather than reading `CONTEXT.md`.
- A failed drift-guard test means the checked-in artifact is stale; rerunning the generator resolves it.
