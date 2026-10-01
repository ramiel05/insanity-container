import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import * as api from "#lib/api";
import { effectiveTimeZone } from "#lib/day";
import { listsKey, northStarsKey, settingsKey, starsKey } from "#lib/workspace-cache";
import { latestError } from "#lib/workspace-cache";
import { useKindMutations, type KindMutations, type StarPatch, type WorkspaceDeps } from "#lib/workspace-mutations";
import type {
  Blueshift,
  BlueshiftStar,
  CreateBlueshift,
  CreateRedshift,
  Redshift,
  RedshiftStar,
  Settings,
  UpdateBlueshift,
  UpdateRedshift,
} from "@proj/shared";
import type { Kind, Selected } from "#lib/kinds";

export interface WorkspaceOps {
  readonly createShift: (kind: Kind, input: CreateBlueshift | CreateRedshift) => void;
  readonly updateShift: (kind: Kind, id: string, patch: UpdateBlueshift | UpdateRedshift) => void;
  readonly deleteShift: (kind: Kind, id: string) => void;
  readonly createStar: (kind: Kind, shiftId: string, title: string) => void;
  readonly updateStar: <K extends Kind>(kind: K, id: string, patch: StarPatch<K>) => void;
  readonly deleteStar: (kind: Kind, id: string) => void;
  readonly updateSettings: (input: { readonly timezone: string | null }) => void;
}

export interface WorkspaceErrors {
  readonly createShift: (kind: Kind) => string | undefined;
  readonly deleteShift: (kind: Kind) => string | undefined;
  readonly createStar: (kind: Kind) => string | undefined;
  readonly latestStar: (kind: Kind) => string | undefined;
  readonly settings: string | undefined;
}

export type ShiftOf<K extends Kind> = K extends "blueshift" ? Blueshift : Redshift;
export type StarOf<K extends Kind> = K extends "blueshift" ? BlueshiftStar : RedshiftStar;

export interface Workspace {
  readonly blueshifts: readonly Blueshift[];
  readonly redshifts: readonly Redshift[];
  readonly stars: readonly BlueshiftStar[];
  readonly redshiftStars: readonly RedshiftStar[];
  readonly northStars: readonly BlueshiftStar[];
  readonly settings?: Settings;
  readonly timeZone: string;
  readonly selectedBlueshift?: Blueshift;
  readonly selectedRedshift?: Redshift;
  readonly queryError: Error | null;
  readonly northStarsError: Error | null;
  readonly pending: boolean;
  readonly refresh: () => void;
  readonly ops: WorkspaceOps;
  readonly errors: WorkspaceErrors;
}

interface KindState<K extends Kind> {
  readonly list: UseQueryResult<ShiftOf<K>[]>;
  readonly stars: UseQueryResult<StarOf<K>[]>;
  readonly mutations: KindMutations;
}

function useKindState<K extends Kind>(
  kind: K,
  list: UseQueryResult<ShiftOf<K>[]>,
  stars: UseQueryResult<StarOf<K>[]>,
  deps: WorkspaceDeps,
  refresh: () => void,
): KindState<K> {
  return { list, stars, mutations: useKindMutations(kind, deps, refresh) };
}

export function useWorkspace(selected: Selected, deps: WorkspaceDeps): Workspace {
  const client = useQueryClient();
  const refresh = (): void => {
    void client.invalidateQueries({ queryKey: ["lists"] });
    void client.invalidateQueries({ queryKey: starsKey() });
    void client.invalidateQueries({ queryKey: northStarsKey() });
  };
  const blueshiftState = useKindState(
    "blueshift",
    useQuery({ queryKey: listsKey("blueshift"), queryFn: api.listBlueshifts }),
    useQuery({
      queryKey: [...starsKey(), "blueshift", selected?.id],
      queryFn: async () => {
        if (!selected) throw new Error("Cannot list Blueshift Stars without a selected Blueshift");
        const rows = await api.listBlueshiftStars(selected.id);
        return rows;
      },
      enabled: selected?.kind === "blueshift",
    }),
    deps,
    refresh,
  );
  const redshiftState = useKindState(
    "redshift",
    useQuery({ queryKey: listsKey("redshift"), queryFn: api.listRedshifts }),
    useQuery({
      queryKey: [...starsKey(), "redshift", selected?.id],
      queryFn: async () => {
        if (!selected) throw new Error("Cannot list Redshift Stars without a selected Redshift");
        const rows = await api.listRedshiftStars(selected.id);
        return rows;
      },
      enabled: selected?.kind === "redshift",
    }),
    deps,
    refresh,
  );
  const northStarsQuery = useQuery({ queryKey: northStarsKey(), queryFn: api.listNorthStars });
  const settingsQuery = useQuery({ queryKey: settingsKey(), queryFn: api.getSettings });
  const stateFor = (kind: Kind): KindState<Kind> => (kind === "blueshift" ? blueshiftState : redshiftState);

  const updateSettings = useMutation({
    mutationFn: async (input: { readonly timezone: string | null }) => {
      const settings = await api.updateSettings(input);
      return settings;
    },
    onSuccess: () => {
      deps.onCloseModal();
      void client.invalidateQueries({ queryKey: settingsKey() });
      refresh();
    },
  });

  const ops: WorkspaceOps = {
    createShift: (kind, input) => {
      stateFor(kind).mutations.create.mutate(input);
    },
    updateShift: (kind, id, patch) => {
      stateFor(kind).mutations.update.mutate([id, patch]);
    },
    deleteShift: (kind, id) => {
      stateFor(kind).mutations.remove.mutate(id);
    },
    createStar: (kind, shiftId, title) => {
      stateFor(kind).mutations.createStar.mutate([shiftId, title]);
    },
    updateStar: (kind, id, patch) => {
      stateFor(kind).mutations.updateStar.mutate([id, patch]);
    },
    deleteStar: (kind, id) => {
      stateFor(kind).mutations.removeStar.mutate(id);
    },
    updateSettings: (input) => {
      updateSettings.mutate(input);
    },
  };

  const errors: WorkspaceErrors = {
    createShift: (kind) => stateFor(kind).mutations.create.error?.message,
    deleteShift: (kind) => stateFor(kind).mutations.remove.error?.message,
    createStar: (kind) => stateFor(kind).mutations.createStar.error?.message,
    latestStar: (kind) => {
      const { createStar, updateStar, removeStar } = stateFor(kind).mutations;
      return latestError([createStar, updateStar, removeStar]);
    },
    settings: updateSettings.error?.message,
  };

  const queryError =
    blueshiftState.list.error ??
    redshiftState.list.error ??
    northStarsQuery.error ??
    blueshiftState.stars.error ??
    redshiftState.stars.error ??
    settingsQuery.error;

  return {
    blueshifts: blueshiftState.list.data ?? [],
    redshifts: redshiftState.list.data ?? [],
    stars: blueshiftState.stars.data ?? [],
    redshiftStars: redshiftState.stars.data ?? [],
    northStars: northStarsQuery.data ?? [],
    settings: settingsQuery.data,
    timeZone: effectiveTimeZone(),
    selectedBlueshift: blueshiftState.list.data?.find(
      (item) => item.id === selected?.id && selected?.kind === "blueshift",
    ),
    selectedRedshift: redshiftState.list.data?.find(
      (item) => item.id === selected?.id && selected?.kind === "redshift",
    ),
    queryError,
    northStarsError: northStarsQuery.error,
    pending: blueshiftState.list.isPending || redshiftState.list.isPending || northStarsQuery.isPending,
    refresh,
    ops,
    errors,
  };
}
