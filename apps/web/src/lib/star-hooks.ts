import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import * as api from "#lib/api";
import type { BlueshiftStar, RedshiftStar } from "@proj/shared";

export interface StarKindMutations<TStar, TUpdate> {
  readonly createStar: UseMutationResult<TStar, Error, { readonly id: string; readonly title: string }>;
  readonly updateStar: UseMutationResult<TStar, Error, TUpdate>;
  readonly deleteStar: UseMutationResult<void, Error, string>;
}

export interface StarMutations {
  readonly blueshift: StarKindMutations<
    BlueshiftStar,
    { readonly id: string; readonly completed?: boolean; readonly northStar?: boolean }
  >;
  readonly redshift: StarKindMutations<RedshiftStar, { readonly id: string; readonly completed: boolean }>;
}

interface MutationErrorView {
  readonly error: { readonly message: string } | null;
  readonly errorUpdatedAt: number;
}

export function latestMutationError(mutations: readonly MutationErrorView[]): string | undefined {
  let latestMessage: string | undefined;
  let latestAt = 0;
  for (const mutation of mutations) {
    if (mutation.error !== null && mutation.errorUpdatedAt > latestAt) {
      latestAt = mutation.errorUpdatedAt;
      latestMessage = mutation.error.message;
    }
  }
  return latestMessage;
}

export interface StarErrors {
  readonly latest?: string;
  readonly create?: string;
}

export function starErrorsFor<TStar, TUpdate>(starMutations: StarKindMutations<TStar, TUpdate>): StarErrors {
  return {
    latest: latestMutationError(Object.values(starMutations)),
    create: starMutations.createStar.error?.message,
  };
}

export function useStarMutations(refresh: () => void): StarMutations {
  const client = useQueryClient();
  const createStar = useMutation({
    mutationFn: async ({ id, title }: { readonly id: string; readonly title: string }) => {
      const created = await api.createBlueshiftStar(id, { title });
      return created;
    },
    onSuccess: () => {
      refresh();
    },
  });
  const createRedshiftStar = useMutation({
    mutationFn: async ({ id, title }: { readonly id: string; readonly title: string }) => {
      const created = await api.createRedshiftStar(id, { title });
      return created;
    },
    onSuccess: () => {
      refresh();
    },
  });
  const updateStar = useMutation({
    mutationFn: async ({
      id,
      ...input
    }: {
      readonly id: string;
      readonly completed?: boolean;
      readonly northStar?: boolean;
    }) => {
      const updated = await api.updateBlueshiftStar(id, input);
      return updated;
    },
    onMutate: async ({ id, ...input }) => {
      await client.cancelQueries({ queryKey: ["stars"] });
      await client.cancelQueries({ queryKey: ["north-stars"] });
      const previousStars = client.getQueriesData<BlueshiftStar[]>({ queryKey: ["stars"] });
      const previousNorthStars = client.getQueryData<BlueshiftStar[]>(["north-stars"]);
      client.setQueriesData<BlueshiftStar[]>({ queryKey: ["stars"] }, (current) =>
        current === undefined ? current : current.map((star) => (star.id === id ? { ...star, ...input } : star)),
      );
      client.setQueryData<BlueshiftStar[]>(["north-stars"], (current) => {
        if (current === undefined) return current;
        if (input.northStar === false) return current.filter((star) => star.id !== id);
        if (input.northStar !== true) return current;
        const star = previousStars
          .map(([, data]) => data ?? [])
          .flat()
          .find((item) => item.id === id);
        if (star === undefined) return current;
        return [...current.filter((item) => item.id !== id), { ...star, ...input }];
      });
      return { previousStars, previousNorthStars };
    },
    onError: (_error, _vars, context) => {
      if (context === undefined) return;
      for (const [key, data] of context.previousStars) client.setQueryData(key, data);
      if (context.previousNorthStars !== undefined) client.setQueryData(["north-stars"], context.previousNorthStars);
    },
    onSettled: () => {
      refresh();
    },
  });
  const updateRedshiftStar = useMutation({
    mutationFn: async ({ id, completed }: { readonly id: string; readonly completed: boolean }) => {
      const updated = await api.updateRedshiftStar(id, { completed });
      return updated;
    },
    onMutate: async ({ id, completed }) => {
      await client.cancelQueries({ queryKey: ["redshift-stars"] });
      const previousStars = client.getQueriesData<RedshiftStar[]>({ queryKey: ["redshift-stars"] });
      client.setQueriesData<RedshiftStar[]>({ queryKey: ["redshift-stars"] }, (current) =>
        current === undefined
          ? current
          : current.map((star) => (star.id === id ? { ...star, completedAt: completed ? Date.now() : null } : star)),
      );
      return { previousStars };
    },
    onError: (_error, _vars, context) => {
      if (context === undefined) return;
      for (const [key, data] of context.previousStars) client.setQueryData(key, data);
    },
    onSettled: () => {
      refresh();
    },
  });
  const deleteStar = useMutation({
    mutationFn: async (id: string) => {
      await api.deleteBlueshiftStar(id);
    },
    onSuccess: () => {
      refresh();
    },
  });
  const deleteRedshiftStar = useMutation({
    mutationFn: async (id: string) => {
      await api.deleteRedshiftStar(id);
    },
    onSuccess: () => {
      refresh();
    },
  });
  return {
    blueshift: { createStar, updateStar, deleteStar },
    redshift: { createStar: createRedshiftStar, updateStar: updateRedshiftStar, deleteStar: deleteRedshiftStar },
  };
}
