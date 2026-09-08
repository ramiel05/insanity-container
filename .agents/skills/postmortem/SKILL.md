---
name: postmortem
description: Use when asked for a postmortem, or when an implementation task turned into a rough ride - unexpected troubleshooting, rework, or human steering to get it working and avoid regressions.
---

Postmortem an implementation task that was a rough ride. Nothing about this analysis is written down except the mechanisms you build: they are the record.

## 1. Reconstruct the timeline

Same session: work from conversation memory. Fresh session: reconstruct from git log, diffs, commits, and issue threads.

Done when you have an account of expected vs actual - where the ride diverged from smooth - not just "it was painful".

## 2. Isolate the traps

Separate the traps from the paving:

- A **trap** is what caused the ride: a missing fact, wrong assumption, environment gotcha, ordering constraint.
- The **paving** is the workaround that shipped.

State each trap as a generalizable claim ("X bites because Y"), never an incident narrative ("the deploy failed on Tuesday").

## 3. Dedup

Scan existing skills, AGENTS.md, ADRs, and CONTEXT.md for coverage of each trap. Anything already covered gets amended, not duplicated with a new file.

## 4. Check for dominoes

If trap 1 avoided would have prevented traps 2..n, they are dominoes: one mechanism, at the root trap.

## 5. Propose mechanisms

One per non-domino trap, from this menu keyed to trap type - a code guardrail beats documentation whenever the trap can be enforced:

1. **Code guardrail** - test, lint rule, type, schema check
2. **Skill** (`.agents/skills/`) - behavioural trap: a process, checklist, order of operations
3. **AGENTS.md line** - environment gotcha true of the repo but written nowhere
4. **ADR** (`docs/adr/`) - the trap is really a design decision needing rationale
5. **CONTEXT.md entry** - term confusion
6. **Issue/ticket** - the fix is real work, not writing

Present the shortlist with a recommendation and wait for the user to confirm.

## 6. Counterfactual check

For each confirmed mechanism: would it, had it existed, actually have changed the course of this task? If no, it aims at the wrong trap - back to step 2.

## 7. Build

Follow the mechanism's own convention:

- Skill or AGENTS.md line → the `writing-for-agents` skill
- ADR or CONTEXT.md entry → the `domain-modeling` skill
- Issue/ticket → `docs/agents/issue-tracker.md`
- Code guardrail → implement it, with a test proving it fires
