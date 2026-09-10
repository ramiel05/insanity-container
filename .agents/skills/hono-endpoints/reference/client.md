# Client calls

Reference for adding or changing a query or mutation that calls the API from the web app. The example below is contrived; the pattern is the rule.

## Rules

- **Route every call through the named functions.** The web app's api module wraps `hc<AppType>` and `unwrap` behind named exports (`listGizmos()`, `createGizmo(input)`, …). `unwrap` throws an Error carrying the status code and response body text on any non-success status, before any parsing, and resolves `undefined` for empty 204 bodies. Hooks and components call those functions; they do not import the client. Add a new endpoint by wrapping `client.api.<path>.$verb(...)` in a named function next to the others. Call sites supply no generic: the payload type is inferred from the endpoint, with error-status responses filtered out of the type so an error body can never be mistaken for data.
- **Render the states the data-fetching library reports.** Query pending and error states render visibly and stay distinct from genuinely empty data; a query error shows one shared message with the local-dev hint to start the API dev server (the repo's dev command, per `AGENTS.md`). Mutation errors render near the control that triggered them; creation modals stay open and keep their input on failure — success is the only thing that closes them.

## Example

A query, a creation, and a delete, plus the visible states around them.

```tsx
const gizmos = useQuery({
  queryKey: ["gizmos"],
  queryFn: async () => {
    const rows = await api.listGizmos();
    return rows;
  },
});

const createGizmo = useMutation({
  mutationFn: async (input: CreateGizmo) => {
    const created = await api.createGizmo(input);
    return created;
  },
  onSuccess: () => setModal(null),
});

const deleteGizmo = useMutation({
  mutationFn: async (id: string) => {
    await api.deleteGizmo(id);
  },
  onSuccess: refresh,
});

const queryError = gizmos.error;

return <>
  {queryError && <section role="alert">Couldn't load your workspace. If the API isn't running, start it locally with the repo's dev command.</section>}
  {!queryError && gizmos.isPending && <p role="status">Loading…</p>}
  {createGizmo.error?.message && <p role="alert">Couldn't create the Gizmo: {createGizmo.error.message}</p>}
</>;
```
