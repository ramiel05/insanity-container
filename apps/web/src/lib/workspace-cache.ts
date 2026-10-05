import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { BlueshiftStar } from "@proj/shared";

export interface BlueshiftStarPatch {
  readonly completed?: boolean;
  readonly northStar?: boolean;
  readonly blackhole?: boolean;
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
export const starsOfKindKey = (kind: "blueshift" | "redshift"): QueryKey => [...starsKey(), kind];
export const shiftStarsKey = (kind: "blueshift" | "redshift", shiftId: string): QueryKey => [
  ...starsOfKindKey(kind),
  shiftId,
];
export const northStarsKey = (): QueryKey => ["north-stars"];
export const blackholesKey = (): QueryKey => ["blackholes"];
export const settingsKey = (): QueryKey => ["settings"];

export function invalidate(client: QueryClient, keys: readonly QueryKey[]): void {
  for (const key of keys) void client.invalidateQueries({ queryKey: key });
}

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
  readonly blackhole?: boolean;
};

function maintainSectionList(
  client: QueryClient,
  key: QueryKey,
  sectionKey: QueryKey,
  id: string,
  member: boolean,
  donePatch: {
    readonly completedAt?: number | null;
    readonly northStar?: boolean;
    readonly blackhole?: boolean;
  },
): void {
  client.setQueryData<BlueshiftStar[]>(sectionKey, (current) => {
    if (current === undefined) return current;
    if (!member) return current.filter((item) => item.id !== id);
    const star = client
      .getQueriesData<BlueshiftStar[]>({ queryKey: key })
      .map(([, data]) => data ?? [])
      .flat()
      .find((item) => item.id === id);
    if (star === undefined) return current;
    return [...current.filter((item) => item.id !== id), { ...star, ...donePatch }];
  });
}

export function applyStarPatch(
  client: QueryClient,
  key: QueryKey,
  id: string,
  patch: BlueshiftStarPatch,
  now: number,
): void {
  const donePatch: { completedAt?: number | null; northStar?: boolean; blackhole?: boolean } = {};
  if (patch.completed === true) donePatch.completedAt = now;
  if (patch.completed === false) donePatch.completedAt = null;
  if ("northStar" in patch && patch.northStar !== undefined) donePatch.northStar = patch.northStar;
  if ("blackhole" in patch && patch.blackhole !== undefined) donePatch.blackhole = patch.blackhole;
  patchListItems<BlueshiftStar>(client, key, id, donePatch);
  const northStar = "northStar" in patch ? patch.northStar : undefined;
  if (northStar !== undefined) {
    maintainSectionList(client, key, northStarsKey(), id, northStar, donePatch);
  }
  const collapse = "blackhole" in patch && patch.blackhole !== undefined ? patch.blackhole : undefined;
  if (collapse !== undefined || patch.completed === true) {
    const member = collapse === true && patch.completed !== true;
    maintainSectionList(client, key, blackholesKey(), id, member, donePatch);
  }
}

export function removeStarEverywhere(client: QueryClient, key: QueryKey, id: string): void {
  client.setQueriesData<BlueshiftStar[]>({ queryKey: key }, (current) => current?.filter((item) => item.id !== id));
  for (const sectionKey of [northStarsKey(), blackholesKey()]) {
    client.setQueryData<BlueshiftStar[]>(sectionKey, (current) => current?.filter((item) => item.id !== id));
  }
}

export type Snapshot = ReadonlyArray<readonly [QueryKey, unknown]>;

export function snapshot(client: QueryClient, key: QueryKey): Snapshot {
  return client.getQueriesData({ queryKey: key });
}

export function restore(client: QueryClient, taken: Snapshot): void {
  for (const [key, data] of taken) client.setQueryData(key, data);
}
