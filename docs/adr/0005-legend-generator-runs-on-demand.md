# Legend Generator Runs On Demand

**Status:** accepted
**Date:** 2026-09-06

ADR 0004 wired the Legend generator into the root `dev` and `build` scripts so no one regenerates manually. That chained two concerns into each script: `dev` started servers and generated, `build` built and generated. Every invocation paid the generation cost regardless of whether the glossary changed, and the scripts stopped being single-purpose.

The generator is instead exposed as a standalone root script, `bun run generate`, and the responsibility to run it after editing `CONTEXT.md` is documented in `README.md` and `AGENTS.md`. The artifact stays checked in, so the repository remains hermetic, and the drift-guard test from ADR 0004 still catches a stale artifact the moment tests run. A future convenience layer (for example, a Makefile chaining generate into typical workflows) may restore the automatic feel without overloading any individual script.

This supersedes the corresponding passage in ADR 0004 ("The repository root `dev` and `build` scripts run the generator before anything else"), which remains an accepted immutable snapshot: the Legend is still generated from the glossary at build time; only the trigger moves from automatic to on-demand.

**Consequences**

- Editing `CONTEXT.md` requires an explicit `bun run generate` before the artifact reflects it.
- Root `dev`, `build`, and `test` scripts each keep a single concern.
- Forgetting to regenerate surfaces as a failing drift-guard test, not silent staleness.
