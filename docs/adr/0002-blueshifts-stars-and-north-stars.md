# Blueshifts, Stars, and North Stars

**Status:** accepted  
**Date:** 2026-08-31

Starway uses Blueshift as its term for a goal-oriented project and Star as its term for an actionable todo belonging to a Blueshift. A Star may be designated as a North Star, a persistent focus designation that is intentionally unlimited. The first experience presents a global North Stars section above a two-column workspace: Blueshifts on the left and the selected Blueshift's Stars on the right. North Stars are global across Blueshifts, remain chronologically ordered, and selecting one navigates to its owning Blueshift.

Blueshifts have a name and optional goal. Stars have a title, completion state, creation timestamp, and exactly one owning Blueshift. Deleting a Blueshift deletes its Stars; deleting a Star removes it immediately, including any North Star designation.

**Consequences**

- The current Blueshift selection never filters the global North Stars section.
- The workspace begins empty on initial load until a Blueshift is explicitly selected; newly created Blueshifts become selected.
- North Star status groups the global view but does not change chronological order within it.
