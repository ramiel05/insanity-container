import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import * as api from "#lib/api";
import { effectiveTimeZone } from "#lib/day";
import type { Blueshift, BlueshiftStar, Redshift, RedshiftStar, Settings } from "@proj/shared";
import type { Kind, Selected } from "#lib/kinds";

export interface MutationDeps {
  readonly refresh: () => void;
  readonly onSelected: (kind: Kind, id: string) => void;
  readonly onDeleted: (kind: Kind, id: string) => void;
  readonly onCloseModal: () => void;
}

export interface ShiftMutations {
  readonly createBlueshift: UseMutationResult<Blueshift, Error, { readonly name: string; readonly goal?: string }>;
  readonly createRedshift: UseMutationResult<Redshift, Error, { readonly name: string; readonly goal?: string }>;
  readonly deleteBlueshift: UseMutationResult<void, Error, string>;
  readonly deleteRedshift: UseMutationResult<void, Error, string>;
  readonly updateSettings: UseMutationResult<Settings, Error, { readonly timezone: string | null }>;
}

export function useShiftMutations(deps: MutationDeps): ShiftMutations {
  const { refresh, onSelected, onDeleted, onCloseModal } = deps;
  const client = useQueryClient();
  const createBlueshift = useMutation({
    mutationFn: async (input: { readonly name: string; readonly goal?: string }) => {
      const created = await api.createBlueshift(input);
      return created;
    },
    onSuccess: (item) => {
      onSelected("blueshift", item.id);
      onCloseModal();
      refresh();
    },
  });
  const createRedshift = useMutation({
    mutationFn: async (input: { readonly name: string; readonly goal?: string }) => {
      const created = await api.createRedshift(input);
      return created;
    },
    onSuccess: (item) => {
      onSelected("redshift", item.id);
      onCloseModal();
      refresh();
    },
  });
  const deleteBlueshift = useMutation({
    mutationFn: async (id: string) => {
      await api.deleteBlueshift(id);
    },
    onSuccess: (_data, id) => {
      onDeleted("blueshift", id);
      refresh();
    },
  });
  const deleteRedshift = useMutation({
    mutationFn: async (id: string) => {
      await api.deleteRedshift(id);
    },
    onSuccess: (_data, id) => {
      onDeleted("redshift", id);
      refresh();
    },
  });
  const updateSettings = useMutation({
    mutationFn: async (input: { readonly timezone: string | null }) => {
      const settings = await api.updateSettings(input);
      return settings;
    },
    onSuccess: () => {
      onCloseModal();
      void client.invalidateQueries({ queryKey: ["settings"] });
      refresh();
    },
  });
  return { createBlueshift, createRedshift, deleteBlueshift, deleteRedshift, updateSettings };
}

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

export interface WorkspaceQueries {
  readonly blueshifts: UseQueryResult<Blueshift[]>;
  readonly redshifts: UseQueryResult<Redshift[]>;
  readonly stars: UseQueryResult<BlueshiftStar[]>;
  readonly redshiftStars: UseQueryResult<RedshiftStar[]>;
  readonly northStars: UseQueryResult<BlueshiftStar[]>;
  readonly settings: UseQueryResult<Settings>;
  readonly timeZone: string;
  readonly refresh: () => void;
  readonly queryError: Error | null;
  readonly pending: boolean;
  readonly selectedBlueshift?: Blueshift;
  readonly selectedRedshift?: Redshift;
}

export function useWorkspaceQueries(selected: Selected): WorkspaceQueries {
  const client = useQueryClient();
  const blueshifts = useQuery({
    queryKey: ["blueshifts"],
    queryFn: async () => {
      const rows = await api.listBlueshifts();
      return rows;
    },
  });
  const redshifts = useQuery({
    queryKey: ["redshifts"],
    queryFn: async () => {
      const rows = await api.listRedshifts();
      return rows;
    },
  });
  const stars = useQuery({
    queryKey: ["stars", selected?.id],
    enabled: selected?.kind === "blueshift",
    queryFn: async () => {
      const rows = await api.listBlueshiftStars(selected?.id ?? "");
      return rows;
    },
  });
  const redshiftStars = useQuery({
    queryKey: ["redshift-stars", selected?.id],
    enabled: selected?.kind === "redshift",
    queryFn: async () => {
      const rows = await api.listRedshiftStars(selected?.id ?? "");
      return rows;
    },
  });
  const northStars = useQuery({
    queryKey: ["north-stars"],
    queryFn: async () => {
      const rows = await api.listNorthStars();
      return rows;
    },
  });
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const current = await api.getSettings();
      return current;
    },
  });

  const refresh = (): void => {
    void client.invalidateQueries({ queryKey: ["blueshifts"] });
    void client.invalidateQueries({ queryKey: ["redshifts"] });
    void client.invalidateQueries({ queryKey: ["stars"] });
    void client.invalidateQueries({ queryKey: ["redshift-stars"] });
    void client.invalidateQueries({ queryKey: ["north-stars"] });
  };

  const queryError =
    blueshifts.error ?? redshifts.error ?? northStars.error ?? stars.error ?? redshiftStars.error ?? settings.error;

  return {
    blueshifts,
    redshifts,
    stars,
    redshiftStars,
    northStars,
    settings,
    timeZone: effectiveTimeZone(),
    refresh,
    queryError,
    pending: blueshifts.isPending || redshifts.isPending || northStars.isPending,
    selectedBlueshift: blueshifts.data?.find((item) => item.id === selected?.id && selected.kind === "blueshift"),
    selectedRedshift: redshifts.data?.find((item) => item.id === selected?.id && selected.kind === "redshift"),
  };
}
