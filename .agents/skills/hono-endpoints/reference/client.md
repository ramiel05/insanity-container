# Client calls

Reference for adding or changing a query or mutation that calls the API from the web app. The example below is contrived; the pattern is the rule.

## Rules

- **Route every call through the funnel.** The web app's api module exports `unwrap`, which throws an Error carrying the status code and response body text on any non-success status, before any parsing, and resolves `undefined` for empty 204 bodies. `unwrap(await api.<path>.$verb(...))` for queries and mutations alike, deletes included. Call sites supply no generic: the payload type is inferred from the endpoint, with error-status responses filtered out of the type so an error body can never be mistaken for data.
- **Render the states the data-fetching library reports.** Query pending and error states render visibly and stay distinct from genuinely empty data; a query error shows one shared message with the local-dev hint to start the API dev server (the repo's dev command, per `AGENTS.md`). Mutation errors render near the control that triggered them; creation modals stay open and keep their input on failure — success is the only thing that closes them.

## Example

A query, a creation, and a delete, plus the visible states around them.

```tsx
const gizmos = useQuery({ queryKey: ["gizmos"], queryFn: async () => unwrap(await api.api.gizmos.$get()) });

const createGizmo = useMutation({
  mutationFn: async (input: CreateGizmo) => unwrap(await api.api.gizmos.$post({ json: input })),
  onSuccess: () => setModal(null),
});

const deleteGizmo = useMutation({
  mutationFn: (id: string) => unwrap(await api.api.gizmos[":id"].$delete({ param: { id } })),
  onSuccess: refresh,
});

const queryError = gizmos.error;

return <>
  {queryError && <section role="alert">Couldn't load your workspace. If the API isn't running, start it locally with the repo's dev command.</section>}
  {!queryError && gizmos.isPending && <p role="status">Loading…</p>}
  {createGizmo.error?.message && <p role="alert">Couldn't create the Gizmo: {createGizmo.error.message}</p>}
</>;
```
