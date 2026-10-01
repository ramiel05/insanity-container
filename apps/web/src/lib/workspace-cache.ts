import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { BlueshiftStar } from "@proj/shared";

export interface BlueshiftStarPatch {
  readonly completed?: boolean;
  readonly northStar?: boolean;
}

export interface ErrorView {
  readonly error: { readonly message: string } | null;
  readonly submittedAt: number;
}

export function latestError(views: readonly ErrorView[]): string | undefined {
  let latestMessage: string | undefined;
  let latestAt = 0;
  for (const view of views) {
    if (view.error !== null && view.submittedAt > latestAt) {
      latestAt = view.submittedAt;
      latestMessage = view.error.message;
    }
  }
  return latestMessage;
}

export const listsKey = (kind: "blueshift" | "redshift"): QueryKey => ["lists", kind];
export const starsKey = (): QueryKey => ["stars"];
export const northStarsKey = (): QueryKey => ["north-stars"];
export const settingsKey = (): QueryKey => ["settings"];

export function patchListItems<T extends { readonly id: string }>(
  client: QueryClient,
  key: QueryKey,
  id: string,
  patch: Partial<T>,
): void {
  client.setQueriesData<T[]>({ queryKey: key }, (current) =>
    current?.map((item) => (item.id === id ? { ...item, ...patch } : item)),
  );
}

export type StarCachePatch = {
  readonly completed?: boolean;
  readonly northStar?: boolean;
};

export function applyStarPatch(
  client: QueryClient,
  key: QueryKey,
  id: string,
  patch: BlueshiftStarPatch,
  now: number,
): void {
  const donePatch: { completedAt?: number | null; northStar?: boolean } = {};
  if (patch.completed === true) donePatch.completedAt = now;
  if (patch.completed === false) donePatch.completedAt = null;
  if ("northStar" in patch && patch.northStar !== undefined) donePatch.northStar = patch.northStar;
  patchListItems<BlueshiftStar>(client, key, id, donePatch);
  const northStar = "northStar" in patch ? patch.northStar : undefined;
  if (northStar === undefined) return;
  client.setQueryData<BlueshiftStar[]>(northStarsKey(), (current) => {
    if (current === undefined) return current;
    if (!northStar) return current.filter((item) => item.id !== id);
    const star = client
      .getQueriesData<BlueshiftStar[]>({ queryKey: key })
      .map(([, data]) => data ?? [])
      .flat()
      .find((item) => item.id === id);
    if (star === undefined) return current;
    return [...current.filter((item) => item.id !== id), { ...star, ...donePatch }];
  });
}

export type Snapshot = ReadonlyArray<readonly [QueryKey, unknown]>;

export function snapshot(client: QueryClient, key: QueryKey): Snapshot {
  return client.getQueriesData({ queryKey: key });
}

export function restore(client: QueryClient, taken: Snapshot): void {
  for (const [key, data] of taken) client.setQueryData(key, data);
}
