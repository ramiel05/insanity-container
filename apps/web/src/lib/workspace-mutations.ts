import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import * as api from "#lib/api";
import {
  applyStarPatch,
  listsKey,
  northStarsKey,
  patchListItems,
  restore,
  snapshot,
  starsKey,
  type BlueshiftStarPatch,
} from "#lib/workspace-cache";
import type {
  Blueshift,
  BlueshiftStar,
  CreateBlueshift,
  CreateRedshift,
  Redshift,
  RedshiftStar,
  UpdateBlueshift,
  UpdateRedshift,
} from "@proj/shared";
import type { Kind } from "#lib/kinds";

export interface WorkspaceHandlers {
  readonly onSelected: (kind: Kind, id: string) => void;
  readonly onDeleted: (kind: Kind, id: string) => void;
  readonly onCloseModal: () => void;
}

export type RedshiftStarPatch = { readonly completed: boolean };

export type StarPatch<K extends Kind> = K extends "blueshift" ? BlueshiftStarPatch : { readonly completed: boolean };

export interface ApiForKind {
  readonly create: (input: CreateBlueshift | CreateRedshift) => Promise<Blueshift | Redshift>;
  readonly update: (id: string, input: UpdateBlueshift | UpdateRedshift) => Promise<Blueshift | Redshift>;
  readonly remove: (id: string) => Promise<void>;
  readonly createStar: (shiftId: string, input: { readonly title: string }) => Promise<BlueshiftStar | RedshiftStar>;
  readonly updateStar: (
    id: string,
    input: BlueshiftStarPatch | RedshiftStarPatch,
  ) => Promise<BlueshiftStar | RedshiftStar>;
  readonly removeStar: (id: string) => Promise<void>;
}

const apiBlueshifts: ApiForKind = {
  create: async (input) => {
    const created = await api.createBlueshift(input);
    return created;
  },
  update: async (id, input) => {
    const updated = await api.updateBlueshift(id, input);
    return updated;
  },
  remove: api.deleteBlueshift,
  createStar: async (shiftId, input) => {
    const created = await api.createBlueshiftStar(shiftId, input);
    return created;
  },
  updateStar: async (id, input) => {
    const updated = await api.updateBlueshiftStar(id, input);
    return updated;
  },
  removeStar: api.deleteBlueshiftStar,
};

const apiRedshifts: ApiForKind = {
  create: async (input) => {
    const created = await api.createRedshift(input);
    return created;
  },
  update: async (id, input) => {
    const updated = await api.updateRedshift(id, input);
    return updated;
  },
  remove: api.deleteRedshift,
  createStar: async (shiftId, input) => {
    const created = await api.createRedshiftStar(shiftId, input);
    return created;
  },
  updateStar: async (id, input) => {
    if (input.completed === undefined) throw new Error("A Redshift Star patch requires completed");
    const updated = await api.updateRedshiftStar(id, { completed: input.completed });
    return updated;
  },
  removeStar: api.deleteRedshiftStar,
};

export interface KindMutations {
  readonly create: UseMutationResult<Blueshift | Redshift, Error, CreateBlueshift | CreateRedshift>;
  readonly update: UseMutationResult<Blueshift | Redshift, Error, readonly [string, UpdateBlueshift | UpdateRedshift]>;
  readonly remove: UseMutationResult<void, Error, string>;
  readonly createStar: UseMutationResult<BlueshiftStar | RedshiftStar, Error, readonly [string, string]>;
  readonly updateStar: UseMutationResult<
    BlueshiftStar | RedshiftStar,
    Error,
    readonly [string, BlueshiftStarPatch | RedshiftStarPatch]
  >;
  readonly removeStar: UseMutationResult<void, Error, string>;
}

export function useKindMutations(kind: Kind, handlers: WorkspaceHandlers, refresh: () => void): KindMutations {
  const client = useQueryClient();
  const apiForKind = kind === "blueshift" ? apiBlueshifts : apiRedshifts;

  const create = useMutation({
    mutationFn: async (input: CreateBlueshift | CreateRedshift) => {
      const created = await apiForKind.create(input);
      return created;
    },
    onSuccess: (created) => {
      handlers.onSelected(kind, created.id);
      handlers.onCloseModal();
      refresh();
    },
  });

  const update = useMutation({
    mutationFn: async ([id, patch]: readonly [string, UpdateBlueshift | UpdateRedshift]) => {
      const updated = await apiForKind.update(id, patch);
      return updated;
    },
    onMutate: async ([id, patch]) => {
      await client.cancelQueries({ queryKey: listsKey(kind) });
      const taken = snapshot(client, listsKey(kind));
      patchListItems<Blueshift>(client, listsKey(kind), id, patch);
      return { taken };
    },
    onError: (_error, _vars, context) => {
      if (context !== undefined) restore(client, context.taken);
    },
    onSettled: () => {
      refresh();
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await apiForKind.remove(id);
    },
    onSuccess: (_data, id) => {
      handlers.onDeleted(kind, id);
      refresh();
    },
  });

  const createStar = useMutation({
    mutationFn: async ([shiftId, title]: readonly [string, string]) => {
      const created = await apiForKind.createStar(shiftId, { title });
      return created;
    },
    onSuccess: () => {
      refresh();
    },
  });

  const updateStar = useMutation({
    mutationFn: async ([id, patch]: readonly [string, BlueshiftStarPatch | RedshiftStarPatch]) => {
      const updated = await apiForKind.updateStar(id, patch);
      return updated;
    },
    onMutate: async ([id, patch]) => {
      await client.cancelQueries({ queryKey: starsKey() });
      if (kind === "blueshift") await client.cancelQueries({ queryKey: northStarsKey() });
      const taken = snapshot(client, starsKey());
      const previousNorthStars = client.getQueryData<BlueshiftStar[]>(northStarsKey());
      applyStarPatch(client, starsKey(), id, patch, Date.now());
      return { taken, previousNorthStars };
    },
    onError: (_error, _vars, context) => {
      if (context === undefined) return;
      restore(client, context.taken);
      if (context.previousNorthStars !== undefined) client.setQueryData(northStarsKey(), context.previousNorthStars);
    },
    onSettled: () => {
      refresh();
    },
  });

  const removeStar = useMutation({
    mutationFn: async (id: string) => {
      await apiForKind.removeStar(id);
    },
    onSuccess: () => {
      refresh();
    },
  });

  return { create, update, remove, createStar, updateStar, removeStar };
}
