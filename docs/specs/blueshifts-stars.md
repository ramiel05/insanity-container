# Blueshifts, Stars, and North Stars

## Problem Statement

The current app presents a flat list of generic tasks and does not help a person connect manageable work to larger goals. It also has no way to organize work into projects or identify the important Stars to work toward today.

## Solution

Replace the flat task experience with a simple, local-first wayfinding workspace. Users create goal-oriented Blueshifts, assign actionable Stars to them, and optionally designate any Stars as North Stars. The screen gives North Stars global prominence, while a selected Blueshift reveals its Stars in a two-column workspace.

## User Stories

1. As a person organizing my work, I want to create a Blueshift with a name, so that I can represent a larger goal.
2. As a person organizing my work, I want to give a Blueshift an optional goal description, so that its intended outcome is clear.
3. As a person organizing my work, I want to see all Blueshifts in a list, so that I can navigate among my goals.
4. As a person organizing my work, I want to select a Blueshift, so that I can see the Stars belonging to it.
5. As a person organizing my work, I want the workspace to start with no Blueshift selected, so that selection is explicit.
6. As a person organizing my work, I want a newly created Blueshift to become selected, so that I can immediately add its first Star.
7. As a person organizing my work, I want to create a Star for the selected Blueshift, so that I can break its goal into actionable work.
8. As a person organizing my work, I want the Create Star control disabled when no Blueshift is selected, so that every Star has an unambiguous owner.
9. As a person organizing my work, I want the Star form to show which Blueshift it belongs to, so that I can confirm its context without reassigning it in the form.
10. As a person organizing my work, I want to create a Star with a title, so that I can record a manageable piece of work.
11. As a person organizing my work, I want to see Stars belonging to the selected Blueshift, so that I can work through that goal.
12. As a person organizing my work, I want Stars ordered by ascending creation timestamp, so that they retain their chronological order.
13. As a person organizing my work, I want to mark a Star complete, so that I can track finished work.
14. As a person organizing my work, I want completed Stars to remain visible with completed styling, so that the Blueshift retains its work history.
15. As a person organizing my work, I want to designate a Star as a North Star, so that I can identify work I want to focus on today.
16. As a person organizing my work, I want to remove a Star's North Star designation, so that I can change my focus.
17. As a person organizing my work, I want multiple North Stars at once, so that the app does not impose an artificial limit.
18. As a person organizing my work, I want North Stars to remain designated after completion, so that completed focus work remains part of the record.
19. As a person organizing my work, I want to see all North Stars across all Blueshifts in one global section, so that my daily focus is not hidden by the current Blueshift selection.
20. As a person organizing my work, I want the North Star section above the Blueshift and Star workspace, so that it has clear daily prominence.
21. As a person organizing my work, I want global North Stars ordered by ascending creation timestamp, so that their chronology is stable.
22. As a person organizing my work, I want clicking a North Star to select its owning Blueshift, so that it serves as a shortcut to its surrounding work.
23. As a person organizing my work, I want North Star completion changes reflected in both the global section and the owning Blueshift's Star list, so that both views stay consistent.
24. As a person organizing my work, I want to delete a Star immediately, so that obsolete work does not remain in my workspace.
25. As a person organizing my work, I want deleting a Star to remove its North Star designation, so that deleted focus work disappears everywhere.
26. As a person organizing my work, I want to delete a Blueshift immediately, so that obsolete goals do not remain in my workspace.
27. As a person organizing my work, I want deleting a Blueshift to delete its Stars, so that orphaned Stars are not left behind.
28. As a person organizing my work, I want the interface to use Blueshift, Star, and North Star terminology, so that the product has a distinct wayfinding identity.
29. As a person organizing my work, I want the app to remain usable without onboarding or explanatory guidance, so that the initial experience stays deliberately minimal.
30. As a developer, I want API behavior tested against an isolated real SQLite database, so that persistence behavior is realistic without contaminating personal data.
31. As a developer, I want browser-level smoke tests for the primary workspace interactions, so that the most important user-visible behavior is protected.

## Implementation Decisions

- Replace the generic Project/Task domain with Blueshift/Star terminology throughout the user interface, API, shared schemas, TypeScript identifiers, and database tables.
- Model one Blueshift-to-many Stars using a simple relational structure. A Blueshift has a name, optional goal, and creation timestamp. A Star has a title, owning Blueshift, completion state, North Star designation, and creation timestamp.
- Keep North Star designation persistent and unlimited. It is not date-scoped and does not reset automatically.
- Expose Blueshift and Star CRUD operations needed by the first experience: list/create/delete Blueshifts, list/create/update/delete Stars, and toggle a Star's completion and North Star designation.
- Provide a global North Stars read model or endpoint that returns designated Stars from every Blueshift in ascending creation timestamp order.
- Keep the selected Blueshift's Stars ordered by ascending creation timestamp. North Star status does not reorder that list.
- Render the screen with top navigation actions, a global North Stars section, a Blueshift list on the left, and the selected Blueshift's Stars on the right.
- Keep the right workspace empty until a Blueshift is selected. Selecting a North Star selects its owning Blueshift. Creating a Blueshift selects it immediately. Deleting the selected Blueshift clears the selection rather than selecting another automatically.
- Disable Create Star without a selected Blueshift. The Create Star modal shows the selected Blueshift as read-only context and accepts only the Star title.
- Show the optional Blueshift goal in the Blueshift presentation without adding an edit workflow.
- Use simple rubbish-bin icon buttons for deletion and do not add confirmation dialogs, soft deletes, migration logic, or backward-compatibility aliases.
- The local database may be nuked for this change; no migration from the existing Projects/Tasks tables is required.
- Use Bun's built-in test runner for server/API integration tests. Run the Hono application through its fetch interface against a fresh temporary SQLite database per test run, and verify API-visible behavior rather than ORM, SQL, or table implementation details.
- Use `@playwright/test` for browser smoke tests against the real Vite web app and API dev server. Cover selection, disabled/enabled controls, modal context, global North Stars, completion, and deletion.
- Add the smallest required test configuration and scripts. Do not add Vitest or a React component-test library for this slice.

## Testing Decisions

- API tests should create isolated temporary SQLite storage and exercise the Hono API through its public fetch boundary. They should assert response status, response data, ordering, and observable cascading behavior.
- API coverage should include Blueshift creation/listing/deletion, Star creation scoped to a Blueshift, completion and North Star toggles, global North Star retrieval, chronological ordering, and Blueshift deletion cascading to Stars.
- Browser tests should use Playwright against the running application and assert visible user behavior rather than React component structure or CSS class names.
- Browser coverage should include the initial empty selection, Blueshift selection, Create Star disabled state, both creation modals, immediate Blueshift selection after creation, global North Star behavior across Blueshifts, completion, and deletion.
- Existing test prior art is absent, so the initial configuration should establish direct Bun and Playwright conventions without introducing a larger test framework.

## Out of Scope

- Editing Blueshifts or Stars.
- Due dates, priorities, estimates, tags, notes, subtasks, recurrence, or dependencies.
- Limiting North Stars or automatically resetting them each day.
- Authentication, accounts, multi-tenancy, SaaS deployment, or Turso integration.
- Migration or backward compatibility for the existing local database and old API routes.
- Onboarding, help text, empty-state guidance, or confirmation dialogs.
- Drag-and-drop ordering, custom ordering, filtering, search, and pagination.

## Further Notes

The canonical vocabulary and product boundaries are recorded in `CONTEXT.md` and ADR 0002. The broader runtime and technology decisions are recorded separately in ADR 0001.
