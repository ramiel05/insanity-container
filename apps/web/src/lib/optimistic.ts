import type { QueryClient, QueryKey } from "@tanstack/react-query";

export type QuerySnapshot<T> = ReadonlyArray<readonly [QueryKey, readonly T[] | undefined]>;

export function snapshotLists<T>(client: QueryClient, queryKey: readonly unknown[]): QuerySnapshot<T> {
  return client.getQueriesData<T[]>({ queryKey });
}

export function patchListItems<T extends { readonly id: string }>(
  client: QueryClient,
  queryKey: readonly unknown[],
  id: string,
  patch: Partial<T>,
): void {
  client.setQueriesData<T[]>({ queryKey }, (current) =>
    current?.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  );
}

export function restoreLists<T>(client: QueryClient, snapshot: QuerySnapshot<T>): void {
  for (const [key, data] of snapshot) client.setQueryData(key, data);
}
