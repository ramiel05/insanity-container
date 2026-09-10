import { useMutation, type UseMutationResult } from "@tanstack/react-query";
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
    onSuccess: () => {
      refresh();
    },
  });
  const updateRedshiftStar = useMutation({
    mutationFn: async ({ id, completed }: { readonly id: string; readonly completed: boolean }) => {
      const updated = await api.updateRedshiftStar(id, { completed });
      return updated;
    },
    onSuccess: () => {
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
